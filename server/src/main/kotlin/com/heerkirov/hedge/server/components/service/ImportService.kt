package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.FileGenerator
import com.heerkirov.hedge.server.components.backend.similar.SimilarFinder
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.dao.illust.ImportImages
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.illust.FileRecord
import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.business.takeAllFilepathOrNull
import com.heerkirov.hedge.server.utils.tools.defer
import com.heerkirov.hedge.server.utils.deleteIfExists
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.escapeLike
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.tuples.Tuple4
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.toListResult
import com.heerkirov.hedge.server.utils.types.undefined
import org.ktorm.dsl.*
import org.ktorm.entity.*
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class ImportService(private val data: DataRepository,
                    private val fileManager: FileManager,
                    private val importManager: ImportManager,
                    private val illustManager: IllustManager,
                    private val sourceManager: SourceImageManager,
                    private val importMetaManager: ImportMetaManager,
                    private val similarFinder: SimilarFinder,
                    private val fileGenerator: FileGenerator) {
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
            .select(
                ImportImages.id, ImportImages.fileName,
                ImportImages.source, ImportImages.sourceId, ImportImages.sourcePart,
                ImportImages.partitionTime, ImportImages.orderTime, ImportImages.tagme,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .whereWithConditions {
                if(!filter.search.isNullOrBlank()) {
                    it += ImportImages.fileName escapeLike filter.search.split(" ").map(String::trim).filter(String::isNotEmpty).joinToString("%", "%", "%")
                }
            }
            .orderBy(orderTranslator, filter.order)
            .limit(filter.offset, filter.limit)
            .toListResult {
                val (file, thumbnailFile) = takeAllFilepathOrNull(it)
                ImportImageRes(
                    it[ImportImages.id]!!, file, thumbnailFile, it[ImportImages.fileName],
                    it[ImportImages.source], it[ImportImages.sourceId], it[ImportImages.sourcePart],
                    it[ImportImages.tagme]!!,
                    it[ImportImages.partitionTime]!!, it[ImportImages.orderTime]!!.parseDateTime())
            }
    }

    /**
     * @throws IllegalFileExtensionError (extension) 此文件扩展名不受支持
     * @throws FileNotFoundError 此文件不存在
     */
    fun import(form: ImportForm): Pair<Int, List<BaseException<*>>> = defer {
        val file = File(form.filepath).applyReturns {
            if(form.removeOriginFile) deleteIfExists()
        }
        if(!file.exists() || !file.canRead()) throw be(FileNotFoundError())

        val fileId = data.db.transaction { fileManager.newFile(file) }.alsoExcept { fileId ->
            fileManager.deleteFile(fileId)
        }.alsoReturns {
            fileGenerator.appendTask(it)
        }

        data.db.transaction {
            importManager.newImportRecord(fileId, sourceFile = file)
        }
    }

    /**
     * @throws IllegalFileExtensionError (extension) 此文件扩展名不受支持
     */
    fun upload(form: UploadForm): Pair<Int, List<BaseException<*>>> = defer {
        val file = Fs.temp(form.extension).applyDefer {
            deleteIfExists()
        }.also { file ->
            Files.copy(form.content, file.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }

        val fileId = data.db.transaction { fileManager.newFile(file) }.alsoExcept { fileId ->
            fileManager.deleteFile(fileId)
        }.alsoReturns {
            fileGenerator.appendTask(it)
        }

        data.db.transaction {
            importManager.newImportRecord(fileId, sourceFilename = form.filename)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): ImportImageDetailRes {
        val row = data.db.from(ImportImages)
            .innerJoin(FileRecords, FileRecords.id eq ImportImages.fileId)
            .select()
            .where { ImportImages.id eq id }
            .firstOrNull() ?: throw be(NotFound())

        val (file, thumbnailFile) = takeAllFilepathOrNull(row)

        return ImportImageDetailRes(
            row[ImportImages.id]!!,
            file, thumbnailFile,
            row[ImportImages.fileName], row[ImportImages.filePath], row[ImportImages.fileFromSource] ?: emptyList(),
            row[ImportImages.fileCreateTime], row[ImportImages.fileUpdateTime], row[ImportImages.fileImportTime]!!,
            row[ImportImages.tagme]!!, row[ImportImages.source], row[ImportImages.sourceId], row[ImportImages.sourcePart],
            row[ImportImages.partitionTime]!!, row[ImportImages.orderTime]!!.parseDateTime(), row[ImportImages.createTime]!!
        )
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun update(id: Int, form: ImportUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(ImportImages).firstOrNull { it.id eq id } ?: throw be(NotFound())

            //source更新检查
            val (newSource, newSourceId, newSourcePart) = if(form.source.isPresent) {
                val source = form.source.value
                if(source == null) {
                    if(form.sourceId.unwrapOr { null } != null || form.sourcePart.unwrapOr { null } != null) throw be(ParamNotRequired("sourceId/sourcePart"))
                    else Triple(Opt(null), Opt(null), Opt(null))
                }else{
                    sourceManager.checkSource(source, form.sourceId.unwrapOr { record.sourceId }, form.sourcePart.unwrapOr { record.sourcePart })
                    Triple(form.source, form.sourceId, form.sourcePart)
                }
            }else if(form.sourceId.unwrapOr { null } != null || form.sourcePart.unwrapOr { null } != null) {
                if(record.source == null) throw be(ParamNotRequired("sourceId/sourcePart"))
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

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            val row = data.db.from(ImportImages).select(ImportImages.fileId).where { ImportImages.id eq id }.firstOrNull() ?: throw be(NotFound())
            data.db.delete(ImportImages) { it.id eq id }
            fileManager.deleteFile(row[ImportImages.fileId]!!)
        }
    }

    /**
     * @throws ResourceNotExist ("target", number[]) 要进行解析的对象不存在。给出不存在的source image id列表
     * @warn InvalidRegexError (regex) 执行正则表达式时发生错误，怀疑是表达式或相关参数没写对
     */
    fun batchUpdate(form: ImportBatchUpdateForm): Map<Int, List<BaseException<*>>> {
        data.db.transaction {
            if(form.tagme != null || form.partitionTime != null || form.setCreateTimeBy != null || form.setOrderTimeBy != null || form.analyseSource) {
                val records = if(form.target.isNullOrEmpty()) {
                    data.db.sequenceOf(ImportImages).toList()
                }else{
                    data.db.sequenceOf(ImportImages).filter { ImportImages.id inList form.target }.toList().also { records ->
                        if(records.size < form.target.size) {
                            throw be(ResourceNotExist("target", form.target.toSet() - records.map { it.id }.toSet()))
                        }
                    }
                }

                val sourceResultMap = mutableMapOf<Int, Tuple4<String, Long?, Int?, Illust.Tagme?>>()
                val errors = mutableMapOf<Int, List<BaseException<*>>>()
                if(form.analyseSource) {
                    val autoSetTagmeOfSource = data.metadata.import.setTagmeOfSource

                    for (record in records) {
                        val (source, sourceId, sourcePart) = try {
                            importMetaManager.analyseSourceMeta(record.fileName, record.fileFromSource)
                        } catch (e: BusinessException) {
                            errors[record.id] = listOf(e.exception)
                            continue
                        }
                        if (source != null) {
                            val tagme = if (autoSetTagmeOfSource && Illust.Tagme.SOURCE in record.tagme) record.tagme - Illust.Tagme.SOURCE else null
                            sourceResultMap[record.id] = Tuple4(source, sourceId, sourcePart, tagme)
                        }
                    }
                }

                data.db.batchUpdate(ImportImages) {
                    for (record in records) {
                        item {
                            where { it.id eq record.id }
                            sourceResultMap[record.id]?.let { (source, sourceId, sourcePart, tagme) ->
                                set(it.source, source)
                                set(it.sourceId, sourceId)
                                set(it.sourcePart, sourcePart)
                                if(tagme != null && form.tagme == null) set(it.tagme, tagme)
                            }
                            if(form.tagme != null) set(it.tagme, form.tagme)
                            if(form.partitionTime != null) set(it.partitionTime, form.partitionTime)
                            if(form.setCreateTimeBy != null) set(it.createTime, when(form.setCreateTimeBy) {
                                ImportOption.TimeType.CREATE_TIME -> record.fileCreateTime ?: record.fileImportTime
                                ImportOption.TimeType.UPDATE_TIME -> record.fileUpdateTime ?: record.fileImportTime
                                ImportOption.TimeType.IMPORT_TIME -> record.fileImportTime
                            })
                            if(form.setOrderTimeBy != null) set(it.orderTime, when(form.setOrderTimeBy) {
                                ImportOption.TimeType.CREATE_TIME -> record.fileCreateTime ?: record.fileImportTime
                                ImportOption.TimeType.UPDATE_TIME -> record.fileUpdateTime ?: record.fileImportTime
                                ImportOption.TimeType.IMPORT_TIME -> record.fileImportTime
                            }.toMillisecond())
                        }
                    }
                }
                return errors
            }
        }

        return emptyMap()
    }

    /**
     * 保存。
     * @throws NotReadyFileError 还存在文件没有准备好，因此保险期间阻止了所有的导入。
     */
    fun save(): ImportSaveRes {
        data.db.transaction {
            val records = data.db.from(ImportImages)
                .innerJoin(FileRecords, ImportImages.fileId eq FileRecords.id)
                .select()
                .map { Pair(ImportImages.createEntity(it), FileRecords.createEntity(it)) }

            if(records.any { (_, file) -> file.status == FileRecord.FileStatus.NOT_READY }) throw be(NotReadyFileError())

            val imageIds = records.map { (record, _) ->
                illustManager.newImage(
                    fileId = record.fileId,
                    tagme = record.tagme,
                    source = record.source,
                    sourceId = record.sourceId,
                    sourcePart = record.sourcePart,
                    partitionTime = record.partitionTime,
                    orderTime = record.orderTime,
                    createTime = record.createTime)
                // 虽然{newImage}方法会抛出很多异常，但那都与这里无关。
                // source虽然是唯一看似有关的，但通过业务逻辑限制，使得不可能删除有实例的site。
                // 就算最后真的出了bug，抛出去当unknown error处理算了。
            }

            data.db.deleteAll(ImportImages)

            if(data.metadata.findSimilar.autoFindSimilar) {
                similarFinder.add(FindSimilarTask.TaskSelectorOfImage(imageIds), data.metadata.findSimilar.autoTaskConf ?: data.metadata.findSimilar.defaultTaskConf)
            }

            return ImportSaveRes(records.size)
        }
    }
}
