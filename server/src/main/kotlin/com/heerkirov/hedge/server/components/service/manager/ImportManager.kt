package com.heerkirov.hedge.server.components.service.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.ImportImages
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.asZonedTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import me.liuwj.ktorm.dsl.insertAndGenerateKey
import java.io.File
import java.nio.file.Files
import java.nio.file.attribute.BasicFileAttributes

class ImportManager(private val data: DataRepository) {
    /**
     * 创建一条新的import记录。
     * @return import image id
     */
    fun create(fileId: Int, sourceFile: File? = null, sourceFilename: String? = null): Int {
        val attr = sourceFile?.let { Files.readAttributes(it.toPath(), BasicFileAttributes::class.java) }

        val createTime = DateTime.now()
        val fileCreateTime = attr?.creationTime()?.toMillis()?.parseDateTime()
        val fileUpdateTime = sourceFile?.lastModified()?.parseDateTime()

        val partitionTime = createTime.asZonedTime().toLocalDate()
        val orderTime = createTime.toMillisecond()

        //TODO 引入自动处理策略(在这之前首先定好actions的行为)

        val id = data.db.insertAndGenerateKey(ImportImages) {
            set(it.fileId, fileId)
            set(it.fileName, sourceFilename ?: sourceFile?.name)
            set(it.filePath, sourceFile?.absoluteFile?.parent)
            set(it.fileCreateTime, fileCreateTime)
            set(it.fileUpdateTime, fileUpdateTime)
            set(it.fileImportTime, createTime)
            set(it.fileFromSource, emptyList())
            set(it.tagme, Illust.Tagme.EMPTY)
            set(it.source, null)
            set(it.sourceId, null)
            set(it.sourcePart, null)
            set(it.partitionTime, partitionTime)
            set(it.orderTime, orderTime)
            set(it.createTime, createTime)
            set(it.actions, null)
        } as Int

        return id
    }
}