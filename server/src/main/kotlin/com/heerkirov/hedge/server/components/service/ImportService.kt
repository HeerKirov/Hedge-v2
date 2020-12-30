package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.dao.FileRecords
import com.heerkirov.hedge.server.dao.ImportImages
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.defer
import com.heerkirov.hedge.server.utils.deleteIt
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.toListResult
import com.heerkirov.hedge.server.utils.types.undefined
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class ImportService(private val data: DataRepository,
                    private val fileKit: FileManager,
                    private val importManager: ImportManager,
                    private val illustManager: IllustManager,
                    private val sourceManager: SourceManager,
                    private val importMetaManager: ImportMetaManager) {
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

    fun import(form: ImportForm): Pair<Int, List<BaseException>> = defer {
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

    fun upload(form: UploadForm): Pair<Int, List<BaseException>> = defer {
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

            //source更新检查
            val (newSource, newSourceId, newSourcePart) = if(form.source.isPresent) {
                val source = form.source.value
                if(source == null) {
                    if(form.sourceId.isPresent || form.sourcePart.isPresent) throw ParamNotRequired("sourceId/sourcePart")
                    else Triple(Opt(null), Opt(null), Opt(null))
                }else{
                    sourceManager.checkSource(source, form.sourceId.unwrapOr { record.sourceId }, form.sourcePart.unwrapOr { record.sourcePart })
                    Triple(form.source, form.sourceId, form.sourcePart)
                }
            }else if(form.sourceId.isPresent || form.sourcePart.isPresent) {
                if(record.source == null) throw ParamNotRequired("sourceId/sourcePart")
                else{
                    sourceManager.checkSource(record.source, form.sourceId.unwrapOr { record.sourceId }, form.sourcePart.unwrapOr { record.sourcePart })
                    Triple(undefined(), form.sourceId, form.sourcePart)
                }
            }else Triple(undefined(), undefined(), undefined())

            if (form.tagme.isPresent || form.source.isPresent || form.sourceId.isPresent || form.sourcePart.isPresent ||
                form.partitionTime.isPresent || form.orderTime.isPresent || form.createTime.isPresent) {
                data.db.update(ImportImages) {
                    where { it.id eq id }
                    form.tagme.applyOpt { set(it.tagme, this) }
                    newSource.applyOpt { set(it.source, this) }
                    newSourceId.applyOpt { set(it.sourceId, this) }
                    newSourcePart.applyOpt { set(it.sourcePart, this) }
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

    fun analyseMeta(form: AnalyseMetaForm): AnalyseMetaRes {
        val records = if(form.target.isNullOrEmpty()) {
            data.db.sequenceOf(ImportImages).toList()
        }else{
            data.db.sequenceOf(ImportImages).filter { ImportImages.id inList form.target }.toList().also { records ->
                if(records.size < form.target.size) {
                    throw ResourceNotExist("target", form.target.toSet() - records.asSequence().map { it.id }.toSet())
                }
            }
        }

        val warnings = mutableListOf<ErrorResult>()
        val batch = mutableListOf<Tuple4<Int, String, Long?, Int?>>()

        for(record in records) {
            val (source, sourceId, sourcePart) = try {
                importMetaManager.analyseSourceMeta(record.fileName, record.filePath, record.fileFromSource)
            }catch (e: BaseException) {
                warnings.add(ErrorResult(e))
                continue
            }
            if(source != null) {
                batch.add(Tuple4(record.id, source, sourceId, sourcePart))
            }
        }

        if(batch.isNotEmpty()) {
            data.db.batchUpdate(ImportImages) {
                for ((id, source, sourceId, sourcePart) in batch) {
                    item {
                        where { it.id eq id }
                        set(it.source, source)
                        set(it.sourceId, sourceId)
                        set(it.sourcePart, sourcePart)
                    }
                }
            }
        }

        return AnalyseMetaRes(records.size, batch.size, records.size - batch.size - warnings.size, warnings)
    }

    fun save() {
        TODO()
    }
}