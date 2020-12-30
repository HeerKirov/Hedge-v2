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
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.defer
import com.heerkirov.hedge.server.utils.deleteIt
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
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

        return ImportImageDetailRes(
            row[ImportImages.id]!!,
            fileKit.getFilepath(folder, fileId, extension),
            if(hasThumbnail) fileKit.getThumbnailPath(folder, fileId) else null,
            row[ImportImages.fileName], row[ImportImages.filePath],
            row[ImportImages.fileCreateTime], row[ImportImages.fileUpdateTime], row[ImportImages.fileImportTime]!!,
            row[ImportImages.tagme]!!, row[ImportImages.source], row[ImportImages.sourceId], row[ImportImages.sourcePart],
            row[ImportImages.partitionTime]!!, row[ImportImages.orderTime]!!.parseDateTime(), row[ImportImages.createTime]!!
        )
    }

    fun update(id: Int, form: ImportUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(ImportImages).firstOrNull { it.id eq id } ?: throw NotFound()

            //TODO 调整site的模式：
            //      - 使用严格模式，在导入/设置解析规则等时都要比对site列表进行验证，包括验证id的缺失
            //      - 换回使用REST五段API操作site
            //      - 对site的更新会反映到import/illust上；对site的删除会报错 或 在SET_NULL模式设null
            //      - id的存在性配置无法变更，是锁死的
            //     rule与之配对的方式是解耦的，仅通过site名称联系在一起，没有强指定作用。
            //      - import rule通过site名称配对，没有系统预定的部分；
            //      - spider rule的爬虫算法是写死的，已经实现的爬虫算法列出一个列表，需要和import rule一样创建spider rule，为site指定使用的算法(也要校验id的缺失)
            //     尽管site/import rule/spider rule三方解耦，但系统在模块之外仍然内置了支持site的全套预设方案，以方便使用。解耦是为了创造灵活性。

            if (form.tagme.isPresent || form.source.isPresent || form.sourceId.isPresent || form.sourcePart.isPresent ||
                form.partitionTime.isPresent || form.orderTime.isPresent || form.createTime.isPresent) {
                data.db.update(ImportImages) {
                    where { it.id eq id }
                    form.tagme.applyOpt { set(it.tagme, this) }
                    form.source.applyOpt { set(it.source, this) }
                    form.sourceId.applyOpt { set(it.sourceId, this) }
                    form.sourcePart.applyOpt { set(it.sourcePart, this) }
                    form.partitionTime.applyOpt { set(it.partitionTime, this) }
                    form.orderTime.applyOpt { set(it.orderTime, this.toMillisecond()) }
                    form.createTime.applyOpt { set(it.createTime, this) }
                }
            }
        }
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