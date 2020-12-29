package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.dao.ImportImages
import com.heerkirov.hedge.server.library.xattr.XAttrProcessor
import com.heerkirov.hedge.server.model.Illust
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
     * @return import image id
     */
    fun newImportRecord(fileId: Int, sourceFile: File? = null, sourceFilename: String? = null): Int {
        val options = data.metadata.import

        val attr = sourceFile?.let { Files.readAttributes(it.toPath(), BasicFileAttributes::class.java) }

        val fileFromSource = sourceFile?.let {
            val xattr = XAttrProcessor.readXattrProp(it.absolutePath, "com.apple.metadata:kMDItemWhereFroms")
            if(xattr != null) XAttrProcessor.decodePList(xattr) else null
        }

        val fileImportTime = DateTime.now()
        val fileCreateTime = attr?.creationTime()?.toMillis()?.parseDateTime()
        val fileUpdateTime = sourceFile?.lastModified()?.parseDateTime()

        val createTime = when(options.setCreateTimeBy) {
            ImportOption.TimeType.CREATE_TIME -> fileCreateTime
            ImportOption.TimeType.IMPORT_TIME -> fileImportTime
            ImportOption.TimeType.UPDATE_TIME -> fileUpdateTime
        }
        val partitionTime = fileImportTime.runIf(options.setPartitionTimeDelay != null && options.setPartitionTimeDelay!! > 0) {
            (this.toMillisecond() - options.setPartitionTimeDelay!!).parseDateTime()
        }.asZonedTime().toLocalDate()
        val orderTime = fileImportTime.toMillisecond()

        val tagme = if(options.setTagme.isEmpty()) Illust.Tagme.EMPTY else options.setTagme.map { compositionOf<Illust.Tagme>(it) }.union()

        val fileName = sourceFilename ?: sourceFile?.name
        val filePath = sourceFile?.absoluteFile?.parent

        val (source, sourceId, sourcePart) = if(options.autoAnalyseMeta) {
            importMetaManager.analyseSourceMeta(fileName, filePath, fileFromSource)
        }else Triple(null, null, null)

        return data.db.insertAndGenerateKey(ImportImages) {
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
    }
}