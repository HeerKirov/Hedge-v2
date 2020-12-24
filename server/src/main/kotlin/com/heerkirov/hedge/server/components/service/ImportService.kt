package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.FileRecords
import com.heerkirov.hedge.server.dao.ImportImages
import com.heerkirov.hedge.server.exceptions.FileNotFoundError
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.components.manager.FileManager
import com.heerkirov.hedge.server.components.manager.IllustManager
import com.heerkirov.hedge.server.components.manager.ImportManager
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.defer
import com.heerkirov.hedge.server.utils.deleteIt
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import me.liuwj.ktorm.dsl.*
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class ImportService(private val data: DataRepository,
                    private val fileKit: FileManager,
                    private val importManager: ImportManager,
                    private val illustManager: IllustManager) {
    private val orderTranslator = OrderTranslator {
        "id" to ImportImages.id
        "fileCreateTime" to ImportImages.fileCreateTime nulls last
        "fileUpdateTime" to ImportImages.fileUpdateTime nulls last
        "fileImportTime" to ImportImages.fileImportTime
        "orderTime" to ImportImages.orderTime
    }

    fun list(filter: ImportFilter): ListResult<ImportImageRes> {
        return data.db.from(ImportImages)
            .innerJoin(FileRecords, FileRecords.id eq ImportImages.fileId)
            .select(ImportImages.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .orderBy(filter.order, orderTranslator)
            .limit(filter.offset, filter.limit)
            .toListResult {
                val fileId = it[FileRecords.id]!!
                val folder = it[FileRecords.folder]!!
                val extension = it[FileRecords.extension]!!
                val hasThumbnail = it[FileRecords.thumbnail]!!
                ImportImageRes(it[ImportImages.id]!!, fileKit.getFilepath(folder, fileId, extension), if(hasThumbnail) fileKit.getThumbnailPath(folder, fileId) else null)
            }
    }

    fun import(form: ImportForm): Int = defer {
        val file = File(form.filepath).applyReturns {
            if(form.removeOriginFile) deleteIt()
        }
        if(!file.exists() || !file.canRead()) throw FileNotFoundError()

        val fileId = data.db.transaction { fileKit.newFile(file) }.alsoExcept { fileId ->
            fileKit.revertNewFile(fileId)
        }

        data.db.transaction {
            importManager.newImportRecord(fileId, sourceFile = file)
        }
    }

    fun upload(form: UploadForm): Int = defer {
        val file = Fs.temp(form.extension).applyDefer {
            deleteIt()
        }.also { file ->
            Files.copy(form.content, file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }

        val fileId = data.db.transaction { fileKit.newFile(file) }.alsoExcept { fileId ->
            fileKit.revertNewFile(fileId)
        }

        data.db.transaction {
            importManager.newImportRecord(fileId, sourceFilename = form.filename)
        }
    }

    fun get(id: Int): ImportImageDetailRes {
        val row = data.db.from(ImportImages)
            .innerJoin(FileRecords, FileRecords.id eq ImportImages.fileId)
            .select()
            .where { ImportImages.id eq id }
            .firstOrNull() ?: throw NotFound()

        val fileId = row[FileRecords.id]!!
        val folder = row[FileRecords.folder]!!
        val extension = row[FileRecords.extension]!!
        val hasThumbnail = row[FileRecords.thumbnail]!!

        return ImportImageDetailRes(row[ImportImages.id]!!,
            fileKit.getFilepath(folder, fileId, extension),
            if(hasThumbnail) fileKit.getThumbnailPath(folder, fileId) else null,
            row[ImportImages.fileName], row[ImportImages.filePath],
            row[ImportImages.fileCreateTime], row[ImportImages.fileUpdateTime], row[ImportImages.fileImportTime]!!,
            row[ImportImages.tagme]!!, row[ImportImages.source], row[ImportImages.sourceId], row[ImportImages.sourcePart],
            row[ImportImages.partitionTime]!!, row[ImportImages.orderTime]!!.parseDateTime(), row[ImportImages.createTime]!!)
    }

    fun update(id: Int, form: ImportUpdateForm) {
        TODO()
    }

    fun delete(id: Int) {
        data.db.transaction {
            val row = data.db.from(ImportImages).select(ImportImages.fileId).where { ImportImages.id eq id }.firstOrNull() ?: throw NotFound()
            data.db.delete(ImportImages) { it.id eq id }
            fileKit.deleteFile(row[ImportImages.fileId]!!)
        }
    }

    fun analyseMeta(form: AnalyseMetaForm): Any {
        TODO()
    }

    fun save() {
        TODO()
    }
}