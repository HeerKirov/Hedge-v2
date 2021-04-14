package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.configuration.ConfigurationDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.exceptions.IllegalFileExtensionError
import com.heerkirov.hedge.server.model.source.FileRecord
import com.heerkirov.hedge.server.tools.getFilepath
import com.heerkirov.hedge.server.tools.getThumbnailFilepath
import com.heerkirov.hedge.server.utils.*
import com.heerkirov.hedge.server.utils.DateTime.toDateString
import org.ktorm.dsl.delete
import org.ktorm.dsl.eq
import org.ktorm.dsl.insertAndGenerateKey
import org.ktorm.dsl.update
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import java.io.File
import java.time.LocalDate

class FileManager(private val configurationDriver: ConfigurationDriver, private val data: DataRepository) {
    /**
     * 将指定的File载入到数据库中，同时创建一条新记录。
     * - folder指定为载入时的本地日期。
     * - extension指定为此file的扩展名。
     * - 自动生成thumbnail。
     * - 自动计算大小。
     * @return file id。使用此id来索引物理文件记录。
     */
    fun newFile(file: File): Int = defer {
        val now = DateTime.now()
        val folder = LocalDate.now().toDateString()
        val extension = validateExtension(file.extension)

        val id = data.db.insertAndGenerateKey(FileRecords) {
            set(it.folder, folder)
            set(it.extension, extension)
            set(it.thumbnail, FileRecord.ThumbnailStatus.NULL)
            set(it.size, file.length())
            set(it.thumbnailSize, 0)
            set(it.deleted, false)
            set(it.syncRecords, emptyList())
            set(it.createTime, now)
            set(it.updateTime, now)
        } as Int

        val filepath = getFilepath(folder, id, extension).also { path ->
            file.copyTo(File("${configurationDriver.configuration.dbPath}/${Filename.FOLDER}/$path").applyExcept {
                deleteIfExists()
            }, overwrite = true)
        }

        data.db.update(FileRecords) {
            where { it.id eq id }
            set(it.syncRecords, listOf(FileRecord.SyncRecord(FileRecord.SyncAction.CREATE, filepath)))
        }

        return id
    }

    /**
     * 撤销新建的File。此方法仅用于newFile后产生失败，回滚对物理文件的写入。不能用于删除业务，因为它会完全移除记录。
     */
    fun revertNewFile(fileId: Int) {
        val fileRecord = getFile(fileId) ?: return
        File("${configurationDriver.configuration.dbPath}/${Filename.FOLDER}/${getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)}").deleteIfExists()
        if(fileRecord.thumbnail == FileRecord.ThumbnailStatus.YES) {
            File("${configurationDriver.configuration.dbPath}/${Filename.FOLDER}/${getThumbnailFilepath(fileRecord.folder, fileRecord.id)}").deleteIfExists()
        }
        data.db.delete(FileRecords) { it.id eq fileId }
    }

    /**
     * 删除指定的物理文件。
     * 这是一层被包装的伪删除，数据库中的记录将保留，以便同步。
     */
    fun deleteFile(fileId: Int) {
        val fileRecord = getFile(fileId) ?: return
        val filepath = getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)
        val thumbnailFilepath = if(fileRecord.thumbnail == FileRecord.ThumbnailStatus.YES) {
            getThumbnailFilepath(fileRecord.folder, fileRecord.id)
        }else null

        val now = DateTime.now()
        val syncRecords = fileRecord.syncRecords.run {
            plus(FileRecord.SyncRecord(FileRecord.SyncAction.DELETE, filepath))
        }.runIf(thumbnailFilepath != null) {
            plus(FileRecord.SyncRecord(FileRecord.SyncAction.DELETE, thumbnailFilepath!!))
        }

        data.db.update(FileRecords) {
            where { it.id eq fileId }
            set(it.updateTime, now)
            set(it.deleted, true)
            set(it.syncRecords, syncRecords)
        }

        File("${configurationDriver.configuration.dbPath}/${Filename.FOLDER}/${filepath}").deleteIfExists()
        if(thumbnailFilepath != null) File("${configurationDriver.configuration.dbPath}/${Filename.FOLDER}/${thumbnailFilepath}").deleteIfExists()
    }

    /**
     * 查询一个指定的物理文件记录。
     * 因为模式固定且多处使用，因此封装为一次调用。
     */
    private fun getFile(fileId: Int): FileRecord? {
        return data.db.sequenceOf(FileRecords).firstOrNull { it.id eq fileId }
    }

    /**
     * 检查并纠正一个文件的扩展名。扩展名必须是受支持的扩展名，且统一转换为小写。
     */
    private fun validateExtension(extension: String): String {
        return extension.toLowerCase().apply {
            if(this !in extensions) throw IllegalFileExtensionError(extension)
        }
    }

    private val extensions = arrayOf("jpeg", "jpg", "png", "gif", "mp4", "webm")
}