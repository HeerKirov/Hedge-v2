package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.configuration.ConfigurationDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.library.image.ImageProcessor
import com.heerkirov.hedge.server.model.source.FileRecord
import com.heerkirov.hedge.server.utils.business.getFilepath
import com.heerkirov.hedge.server.utils.business.getThumbnailFilepath
import com.heerkirov.hedge.server.utils.tools.controlledThread
import com.heerkirov.hedge.server.utils.deleteIfExists
import org.ktorm.dsl.*
import org.ktorm.entity.*
import org.slf4j.LoggerFactory
import java.io.File
import java.util.*

/**
 * 处理文件的后台任务。每当新建了新的File时，都应当在后台任务生成其缩略图，并解析其附加参数。
 */
interface FileGenerator : StatefulComponent {
    /**
     * 添加一个新任务。任务不会被持久化，因此此方法仅用于新建File时对此组件发出通知。
     */
    fun appendTask(fileId: Int)
}

const val GENERATE_INTERVAL: Long = 200

class FileGeneratorImpl(private val configurationDriver: ConfigurationDriver, private val data: DataRepository) : FileGenerator {
    private val log = LoggerFactory.getLogger(FileGenerator::class.java)

    private val queue: MutableList<Int> = LinkedList()

    private val daemonTask = controlledThread(thread = ::daemonThread)

    override val isIdle: Boolean get() = !daemonTask.isAlive

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            val tasks = data.db.from(FileRecords)
                .select(FileRecords.id)
                .where { FileRecords.deleted.not() and (FileRecords.status eq FileRecord.FileStatus.NOT_READY) }
                .orderBy(FileRecords.updateTime.asc())
                .map { it[FileRecords.id]!! }
            if(tasks.isNotEmpty()) {
                synchronized(this) {
                    queue.addAll(tasks)
                    daemonTask.start()
                }
            }
        }
    }

    override fun appendTask(fileId: Int) {
        queue.add(fileId)
        daemonTask.start()
    }

    private fun daemonThread() {
        if(queue.isEmpty()) {
            synchronized(this) {
                if(queue.isEmpty()) {
                    daemonTask.stop()
                    return
                }
            }
        }
        val fileId = queue.first()

        try {
            val fileRecord = data.db.sequenceOf(FileRecords).firstOrNull { it.id eq fileId }
            if(fileRecord != null && fileRecord.status == FileRecord.FileStatus.NOT_READY) {
                val filepath = getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)
                val file = File("${configurationDriver.dbPath}/${Filename.FOLDER}/$filepath")
                if(file.exists()) {
                    val (tempFile, resolutionWidth, resolutionHeight) = ImageProcessor.process(file)
                    if(tempFile != null) {
                        val thumbnailFilepath = getThumbnailFilepath(fileRecord.folder, fileRecord.id)
                        val thumbnailFile = File("${configurationDriver.dbPath}/${Filename.FOLDER}/$thumbnailFilepath")
                        try {
                            tempFile.copyTo(thumbnailFile, overwrite = true)

                            data.db.transaction {
                                data.db.update(FileRecords) {
                                    where { it.id eq fileId }
                                    set(it.status, FileRecord.FileStatus.READY)
                                    set(it.thumbnailSize, thumbnailFile.length())
                                    set(it.resolutionWidth, resolutionWidth)
                                    set(it.resolutionHeight, resolutionHeight)
                                }
                            }

                            Thread.sleep(GENERATE_INTERVAL)
                        }catch(_: Exception) {
                            thumbnailFile.deleteIfExists()
                        }finally {
                            tempFile.deleteIfExists()
                        }
                    }else{
                        data.db.transaction {
                            data.db.update(FileRecords) {
                                where { it.id eq fileId }
                                set(it.status, FileRecord.FileStatus.READY_WITHOUT_THUMBNAIL)
                                set(it.resolutionWidth, resolutionWidth)
                                set(it.resolutionHeight, resolutionHeight)
                            }
                        }
                    }

                }else{
                    data.db.transaction {
                        data.db.update(FileRecords) {
                            where { it.id eq fileId }
                            set(it.status, FileRecord.FileStatus.READY_WITHOUT_THUMBNAIL)
                        }
                    }
                }

            }
            queue.remove(fileId)
        }catch (e: Exception) {
            log.error("Error occurred in thumbnail task of file $fileId.", e)
        }
    }
}