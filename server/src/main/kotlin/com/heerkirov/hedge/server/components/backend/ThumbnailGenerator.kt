package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.library.image.ImageProcessor
import com.heerkirov.hedge.server.model.source.FileRecord
import com.heerkirov.hedge.server.tools.getFilepath
import com.heerkirov.hedge.server.tools.getThumbnailFilepath
import com.heerkirov.hedge.server.utils.controlledThread
import com.heerkirov.hedge.server.utils.deleteIfExists
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*
import org.slf4j.LoggerFactory
import java.io.File
import java.util.*

/**
 * 处理缩略图生成的后台任务。每当新建了新的File时，都应当在后台任务生成其缩略图。
 */
interface ThumbnailGenerator : StatefulComponent {
    /**
     * 添加一个新任务。任务不会被持久化，因此此方法仅用于新建File时对此组件发出通知。
     */
    fun appendTask(fileId: Int)
}

class ThumbnailGeneratorImpl(private val appdata: AppDataDriver, private val data: DataRepository) : ThumbnailGenerator {
    private val log = LoggerFactory.getLogger(ThumbnailGenerator::class.java)

    private val queue: MutableList<Int> = LinkedList()

    private val daemonTask = controlledThread(thread = this::daemonThread)

    override val isIdle: Boolean get() = !daemonTask.isAlive

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            val tasks = data.db.from(FileRecords)
                .select(FileRecords.id)
                .where { FileRecords.deleted.not() and (FileRecords.thumbnail eq FileRecord.ThumbnailStatus.NULL) }
                .orderBy(FileRecords.updateTime.asc())
                .map { it[FileRecords.id]!! }
            if(tasks.isNotEmpty()) {
                queue.addAll(tasks)
                daemonTask.start()
            }
        }
    }

    override fun appendTask(fileId: Int) {
        queue.add(fileId)
        daemonTask.start()
    }

    private fun daemonThread() {
        if(queue.isEmpty()) {
            daemonTask.stop()
            return
        }
        val fileId = queue.first()

        try {
            val fileRecord = data.db.sequenceOf(FileRecords).firstOrNull { it.id eq fileId }
            if(fileRecord != null && fileRecord.thumbnail == FileRecord.ThumbnailStatus.NULL) {
                val filepath = getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)
                val file = File("${appdata.data.db.path}/${Filename.FOLDER}/$filepath")
                if(file.exists()) {
                    val tempFile = ImageProcessor.generateThumbnail(file)
                    if(tempFile != null) {
                        val thumbnailFilepath = getThumbnailFilepath(fileRecord.folder, fileRecord.id)
                        val thumbnailFile = File("${appdata.data.db.path}/${Filename.FOLDER}/$thumbnailFilepath")
                        try {
                            tempFile.copyTo(thumbnailFile, overwrite = true)

                            data.db.transaction {
                                data.db.update(FileRecords) {
                                    where { it.id eq fileId }
                                    set(it.thumbnail, FileRecord.ThumbnailStatus.YES)
                                    set(it.thumbnailSize, thumbnailFile.length())
                                    set(it.syncRecords, fileRecord.syncRecords + FileRecord.SyncRecord(FileRecord.SyncAction.CREATE, thumbnailFilepath))
                                }
                            }

                            Thread.sleep(200)
                        }catch(_: Exception) {
                            thumbnailFile.deleteIfExists()
                        }finally {
                            tempFile.deleteIfExists()
                        }
                    }else{
                        data.db.transaction {
                            data.db.update(FileRecords) {
                                where { it.id eq fileId }
                                set(it.thumbnail, FileRecord.ThumbnailStatus.NO)
                            }
                        }
                    }

                }else{
                    data.db.transaction {
                        data.db.update(FileRecords) {
                            where { it.id eq fileId }
                            set(it.thumbnail, FileRecord.ThumbnailStatus.NO)
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