package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.configuration.ConfigurationDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.exceptions.IllegalFileExtensionError
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.illust.FileRecord
import com.heerkirov.hedge.server.utils.business.getFilepath
import com.heerkirov.hedge.server.utils.business.getThumbnailFilepath
import com.heerkirov.hedge.server.utils.tools.*
import com.heerkirov.hedge.server.utils.*
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
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
     * - folder指定为文件的更改日期(UTC)。对于上传的文件，这就相当于取了导入日期。
     * - extension指定为此file的扩展名。
     * - thumbnail和大小等信息留白，处于NOT READY状态，需要调用FileGenerator生成这些信息。
     * @return file id。使用此id来索引物理文件记录。
     * @throws IllegalFileExtensionError (extension) 此文件扩展名不受支持
     */
    fun newFile(file: File): Int = defer {
        val now = DateTime.now()
        val folder = file.lastModified().parseDateTime().toLocalDate().toDateString()
        val extension = validateExtension(file.extension)

        val id = data.db.insertAndGenerateKey(FileRecords) {
            set(it.folder, folder)
            set(it.extension, extension)
            set(it.size, file.length())
            set(it.thumbnailSize, 0)
            set(it.resolutionWidth, 0)
            set(it.resolutionHeight, 0)
            set(it.deleted, false)
            set(it.status, FileRecord.FileStatus.NOT_READY)
            set(it.createTime, now)
            set(it.updateTime, now)
        } as Int

        getFilepath(folder, id, extension).also { path ->
            file.copyTo(File("${configurationDriver.dbPath}/${Filename.FOLDER}/$path").applyExcept {
                deleteIfExists()
            }, overwrite = true)
        }

        return id
    }

    /**
     * 将文件放入垃圾桶。
     * 这不会真实删除文件，只会将其标记为deleted。
     */
    fun trashFile(fileId: Int) {
        val now = DateTime.now()

        data.db.update(FileRecords) {
            where { it.id eq fileId }
            set(it.updateTime, now)
            set(it.deleted, true)
        }
    }

    /**
     * 删除一个文件。
     * 这会确实地删除文件，一并删除数据库记录。
     */
    fun deleteFile(fileId: Int) {
        val fileRecord = getFile(fileId) ?: return
        val filepath = getFilepath(fileRecord.folder, fileRecord.id, fileRecord.extension)
        val thumbnailFilepath = if(fileRecord.status == FileRecord.FileStatus.READY) {
            getThumbnailFilepath(fileRecord.folder, fileRecord.id)
        }else null

        data.db.delete(FileRecords) {
            it.id eq fileId
        }

        File("${configurationDriver.dbPath}/${Filename.FOLDER}/${filepath}").deleteIfExists()
        if(thumbnailFilepath != null) File("${configurationDriver.dbPath}/${Filename.FOLDER}/${thumbnailFilepath}").deleteIfExists()
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
     * @throws IllegalFileExtensionError (extension) 此文件扩展名不受支持
     */
    private fun validateExtension(extension: String): String {
        return extension.lowercase().apply {
            if(this !in extensions) throw be(IllegalFileExtensionError(extension))
        }
    }

    private val extensions = arrayOf("jpeg", "jpg", "png", "gif", "mp4", "webm")
}