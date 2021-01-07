package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.ThumbnailGenerator
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.ImportImages
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.source.FileRecord
import com.heerkirov.hedge.server.tools.getFilepath
import com.heerkirov.hedge.server.tools.getThumbnailFilepath
import com.heerkirov.hedge.server.tools.takeAllFilepath
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.defer
import com.heerkirov.hedge.server.utils.deleteIfExists
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
                    private val fileManager: FileManager,
                    private val importManager: ImportManager,
                    private val illustManager: IllustManager,
                    private val sourceManager: SourceManager,
                    private val importMetaManager: ImportMetaManager,
                    private val thumbnailGenerator: ThumbnailGenerator) {
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
                val (file, thumbnailFile) = takeAllFilepath(it)
                ImportImageRes(it[ImportImages.id]!!, file, thumbnailFile)
            }
    }

    fun import(form: ImportForm): Pair<Int, List<BaseException>> = defer {
        val file = File(form.filepath).applyReturns {
            if(form.removeOriginFile) deleteIfExists()
        }
        if(!file.exists() || !file.canRead()) throw FileNotFoundError()

        val fileId = data.db.transaction { fileManager.newFile(file) }.alsoExcept { fileId ->
            fileManager.revertNewFile(fileId)
        }.alsoReturns {
            thumbnailGenerator.appendTask(it)
        }

        data.db.transaction {
            importManager.newImportRecord(fileId, sourceFile = file)
        }
    }

    fun upload(form: UploadForm): Pair<Int, List<BaseException>> = defer {
        val file = Fs.temp(form.extension).applyDefer {
            deleteIfExists()
        }.also { file ->
            Files.copy(form.content, file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }

        val fileId = data.db.transaction { fileManager.newFile(file) }.alsoExcept { fileId ->
            fileManager.revertNewFile(fileId)
        }.alsoReturns {
            thumbnailGenerator.appendTask(it)
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

        val (file, thumbnailFile) = takeAllFilepath(row)

        return ImportImageDetailRes(
            row[ImportImages.id]!!,
            file, thumbnailFile,
            row[ImportImages.fileName], row[ImportImages.filePath], row[ImportImages.fileFromSource] ?: emptyList(),
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
                    if(form.sourceId.unwrapOr { null } != null || form.sourcePart.unwrapOr { null } != null) throw ParamNotRequired("sourceId/sourcePart")
                    else Triple(Opt(null), Opt(null), Opt(null))
                }else{
                    sourceManager.checkSource(source, form.sourceId.unwrapOr { record.sourceId }, form.sourcePart.unwrapOr { record.sourcePart })
                    Triple(form.source, form.sourceId, form.sourcePart)
                }
            }else if(form.sourceId.unwrapOr { null } != null || form.sourcePart.unwrapOr { null } != null) {
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
            fileManager.deleteFile(row[ImportImages.fileId]!!)
        }
    }

    fun analyseMeta(form: AnalyseMetaForm): AnalyseMetaRes {
        data.db.transaction {
            val records = if(form.target.isNullOrEmpty()) {
                data.db.sequenceOf(ImportImages).toList()
            }else{
                data.db.sequenceOf(ImportImages).filter { ImportImages.id inList form.target }.toList().also { records ->
                    if(records.size < form.target.size) {
                        throw ResourceNotExist("target", form.target.toSet() - records.asSequence().map { it.id }.toSet())
                    }
                }
            }

            val setTagmeOfSource = data.metadata.import.setTagmeOfSource
            val errors = mutableMapOf<Int, ErrorResult>()
            val batch = mutableListOf<Tuple5<Int, String, Long?, Int?, Illust.Tagme?>>()

            for(record in records) {
                val (source, sourceId, sourcePart) = try {
                    importMetaManager.analyseSourceMeta(record.fileName, record.fileFromSource, record.fileCreateTime)
                }catch (e: BaseException) {
                    errors[record.id] = ErrorResult(e)
                    continue
                }
                if(source != null) {
                    val tagme = if(setTagmeOfSource && Illust.Tagme.SOURCE in record.tagme) record.tagme - Illust.Tagme.SOURCE else null
                    batch.add(Tuple5(record.id, source, sourceId, sourcePart, tagme))
                }
            }

            if(batch.isNotEmpty()) {
                data.db.batchUpdate(ImportImages) {
                    for ((id, source, sourceId, sourcePart, tagme) in batch) {
                        item {
                            where { it.id eq id }
                            set(it.source, source)
                            set(it.sourceId, sourceId)
                            set(it.sourcePart, sourcePart)
                            if(tagme != null) set(it.tagme, tagme)
                        }
                    }
                }
            }

            return AnalyseMetaRes(records.size, batch.size, records.size - batch.size - errors.size, errors)
        }
    }

    fun batchUpdate(form: ImportBatchUpdateForm) {
        data.db.transaction {
            val records = if(form.target.isNullOrEmpty()) {
                data.db.sequenceOf(ImportImages).toList()
            }else{
                data.db.sequenceOf(ImportImages).filter { ImportImages.id inList form.target }.toList().also { records ->
                    if(records.size < form.target.size) {
                        throw ResourceNotExist("target", form.target.toSet() - records.map { it.id }.toSet())
                    }
                }
            }

            if(form.tagme.isPresent || form.partitionTime.isPresent || form.setCreateTimeBy.isPresent || form.setOrderTimeBy.isPresent) {
                data.db.batchUpdate(ImportImages) {
                    for (record in records) {
                        item {
                            where { it.id eq record.id }
                            form.tagme.applyOpt { set(it.tagme, this) }
                            form.partitionTime.applyOpt { set(it.partitionTime, this) }
                            form.setCreateTimeBy.alsoOpt { by ->
                                set(it.createTime, when(by) {
                                    ImportOption.TimeType.CREATE_TIME -> record.fileCreateTime ?: record.fileImportTime
                                    ImportOption.TimeType.UPDATE_TIME -> record.fileUpdateTime ?: record.fileImportTime
                                    ImportOption.TimeType.IMPORT_TIME -> it.fileImportTime
                                })
                            }
                            form.setOrderTimeBy.alsoOpt { by ->
                                set(it.orderTime, when(by) {
                                    ImportOption.TimeType.CREATE_TIME -> record.fileCreateTime ?: record.fileImportTime
                                    ImportOption.TimeType.UPDATE_TIME -> record.fileUpdateTime ?: record.fileImportTime
                                    ImportOption.TimeType.IMPORT_TIME -> record.fileImportTime
                                }.toMillisecond())
                            }
                        }
                    }
                }
            }
        }
    }

    fun save(): ImportSaveRes {
        data.db.transaction {
            val records = data.db.sequenceOf(ImportImages).toList()

            val errors = mutableMapOf<Int, ErrorResult>()
            val succeeds = mutableListOf<Int>()

            for (record in records) {
                try {
                    illustManager.newImage(
                        fileId = record.fileId,
                        tagme = record.tagme,
                        source = record.source,
                        sourceId = record.sourceId,
                        sourcePart = record.sourcePart,
                        partitionTime = record.partitionTime,
                        orderTime = record.orderTime,
                        createTime = record.createTime)
                }catch (e: BaseException) {
                    errors[record.id] = ErrorResult(e)
                    continue
                }
                succeeds.add(record.id)
            }

            data.db.delete(ImportImages) { it.id inList succeeds }

            return ImportSaveRes(records.size, succeeds.size, errors)
        }
    }
}

/* 导入性能测试：
    将导入过程划分为几个阶段测试，排除jdbc初始化等的影响后，可以发现这么几个性能影响点：
    1. 生成缩略图的函数。初次可达800ms，平时200ms。对这个过程做分解后：
        1. 做类型转换的部分，初次可达700ms, 平时300ms。可以看到这部分影响很大。继续分解这一过程：
            1. 消除alpha通道的算法，初次460ms，平时270ms。可以看到这个算法的耗时很长。接着拆：
                1. 计算rgb的过程，初次170ms，平时120ms，比我以为的要更长。
                2. 设置rgb的过程，平均20～40ms。
            2. 真正的转换过程，平均150ms。
        2. 做缩放的部分，初次可达200~300ms，平时50～100ms。
    2. 分析sourceFromMeta的函数，平均可达400～600ms，且每次都这样，带来的影响非常大。这个函数调用的是shell工具。
 */