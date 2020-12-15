package com.heerkirov.hedge.server.manager

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.FileRecords
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.exceptions.IllegalFileExtensionError
import com.heerkirov.hedge.server.library.image.ImageProcessor
import com.heerkirov.hedge.server.model.FileRecord
import com.heerkirov.hedge.server.utils.*
import com.heerkirov.hedge.server.utils.DateTime.toDateString
import me.liuwj.ktorm.dsl.delete
import me.liuwj.ktorm.dsl.eq
import me.liuwj.ktorm.dsl.insertAndGenerateKey
import me.liuwj.ktorm.dsl.update
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import java.io.File
import java.time.LocalDate

class FileManager(private val appdata: AppDataDriver, private val data: DataRepository) {
    private val extensions = arrayOf("jpeg", "jpg", "png", "gif", "mp4", "webm")

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

        val thumbnailFile = ImageProcessor.generateThumbnail(file).applyDefer {
            deleteIt()
        }

        val id = data.db.insertAndGenerateKey(FileRecords) {
            set(it.folder, folder)
            set(it.extension, extension)
            set(it.thumbnail, thumbnailFile != null)
            set(it.size, file.length())
            set(it.thumbnailSize, thumbnailFile?.length() ?: 0)
            set(it.deleted, false)
            set(it.syncRecords, emptyList())
            set(it.createTime, now)
            set(it.updateTime, now)
        } as Int

        val filepath = getFilepath(folder, id, extension).also { path ->
            file.copyTo(File("${appdata.data.db.path}/${Filename.FOLDER}/$path").applyExcept {
                deleteIt()
            }, overwrite = true)
        }
        val thumbnailFilepath = thumbnailFile?.let {
            getThumbnailPath(folder, id).also { path ->
                it.copyTo(File("${appdata.data.db.path}/${Filename.FOLDER}/$path").applyExcept {
                    deleteIt()
                }, overwrite = true)
            }
        }

        val syncRecords = if(thumbnailFilepath != null) {
            listOf(FileRecord.SyncRecord(FileRecord.SyncAction.CREATE, filepath), FileRecord.SyncRecord(FileRecord.SyncAction.CREATE, thumbnailFilepath))
        }else{
            listOf(FileRecord.SyncRecord(FileRecord.SyncAction.CREATE, filepath))
        }

        data.db.update(FileRecords) {
            where { it.id eq id }
            set(it.syncRecords, syncRecords)
        }

        return id
    }

    /**
     * 撤销新建的File。此方法仅用于newFile后产生失败，回滚对物理文件的写入。不能用于删除业务，因为它会完全移除记录。
     */
    fun revertNewFile(fileId: Int) {
        val fileRecord = getFile(fileId) ?: return
        File("${appdata.data.db.path}/${Filename.FOLDER}/${getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)}").deleteIt()
        File("${appdata.data.db.path}/${Filename.FOLDER}/${getThumbnailPath(fileRecord.folder, fileRecord.id)}").deleteIt()
        data.db.delete(FileRecords) { it.id eq fileId }
    }

    /**
     * 查询一个指定的物理文件。
     * 因为模式固定且多处使用，因此封装为一次调用。
     */
    private fun getFile(fileId: Int): FileRecord? {
        return data.db.sequenceOf(FileRecords).firstOrNull { it.id eq fileId }
    }

    /**
     * 删除指定的物理文件。
     * 这是一层被包装的伪删除，数据库中的记录将保留，以便同步。
     */
    fun deleteFile(fileId: Int) {
        val fileRecord = getFile(fileId) ?: return
        val filepath = getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)
        val thumbnailFilepath = if(fileRecord.thumbnail) getThumbnailPath(fileRecord.folder, fileRecord.id) else null

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

        File("${appdata.data.db.path}/${Filename.FOLDER}/${filepath}").deleteIt()
        if(thumbnailFilepath != null) File("${appdata.data.db.path}/${Filename.FOLDER}/${thumbnailFilepath}").deleteIt()
    }

    /**
     * 导出文件路径。
     */
    fun getFilepath(folder: String, fileId: Int, extension: String): String {
        return "$folder/$fileId.$extension"
    }

    /**
     * 导出缩略图的路径。
     */
    fun getThumbnailPath(folder: String, fileId: Int): String {
        return "$folder/$fileId.thumbnail.jpg"
    }

    /**
     * 检查并纠正一个文件的扩展名。扩展名必须是受支持的扩展名，且统一转换为小写。
     */
    private fun validateExtension(extension: String): String {
        return extension.toLowerCase().apply {
            if(this !in extensions) throw IllegalFileExtensionError(extension)
        }
    }

}