package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.dao.source.ImportImages
import com.heerkirov.hedge.server.exceptions.BaseException
import com.heerkirov.hedge.server.library.xattr.XAttrProcessor
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.asZonedTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.compositionOf
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.union
import me.liuwj.ktorm.dsl.insertAndGenerateKey
import java.io.File
import java.nio.file.Files
import java.nio.file.attribute.BasicFileAttributes

class ImportManager(private val data: DataRepository, private val importMetaManager: ImportMetaManager) {
    /**
     * 创建一条新的import记录。
     * 在此方法中进行source analyse时，分析过程抛出的异常会被捕获，并以警告的形式返回。
     * @return (import image id, warnings)
     */
    fun newImportRecord(fileId: Int, sourceFile: File? = null, sourceFilename: String? = null): Pair<Int, List<BaseException>> {
        val options = data.metadata.import

        val attr = sourceFile?.let { Files.readAttributes(it.toPath(), BasicFileAttributes::class.java) }

        val fileFromSource = sourceFile?.let { XAttrProcessor.readWhereFromsMetaInMacOS(it.absolutePath) }

        val fileImportTime = DateTime.now()
        val fileCreateTime = attr?.creationTime()?.toMillis()?.parseDateTime()
        val fileUpdateTime = sourceFile?.lastModified()?.parseDateTime()

        val createTime = when(options.setTimeBy) {
            ImportOption.TimeType.CREATE_TIME -> fileCreateTime
            ImportOption.TimeType.UPDATE_TIME -> fileUpdateTime
            ImportOption.TimeType.IMPORT_TIME -> fileImportTime
        } ?: fileImportTime
        val partitionTime = createTime.runIf(options.setPartitionTimeDelay != null && options.setPartitionTimeDelay!! > 0) {
            (this.toMillisecond() - options.setPartitionTimeDelay!!).parseDateTime()
        }.asZonedTime().toLocalDate()
        val orderTime = createTime.toMillisecond()

        val tagme = if(options.setTagme.isEmpty()) Illust.Tagme.EMPTY else options.setTagme.map { compositionOf<Illust.Tagme>(it) }.union()

        val fileName = sourceFilename ?: sourceFile?.name
        val filePath = sourceFile?.absoluteFile?.parent

        val warnings = mutableListOf<BaseException>()

        val (source, sourceId, sourcePart) = if(options.autoAnalyseMeta) {
            try {
                importMetaManager.analyseSourceMeta(fileName, fileFromSource, fileCreateTime)
            }catch (e: BaseException) {
                warnings.add(e)
                Triple(null, null, null)
            }
        }else Triple(null, null, null)

        val id = data.db.insertAndGenerateKey(ImportImages) {
            set(it.fileId, fileId)
            set(it.fileName, fileName)
            set(it.filePath, filePath)
            set(it.fileCreateTime, fileCreateTime)
            set(it.fileUpdateTime, fileUpdateTime)
            set(it.fileImportTime, fileImportTime)
            set(it.fileFromSource, fileFromSource)
            set(it.tagme, tagme)
            set(it.source, source)
            set(it.sourceId, sourceId)
            set(it.sourcePart, sourcePart)
            set(it.partitionTime, partitionTime)
            set(it.orderTime, orderTime)
            set(it.createTime, createTime)
        } as Int

        return Pair(id, warnings)
    }
}