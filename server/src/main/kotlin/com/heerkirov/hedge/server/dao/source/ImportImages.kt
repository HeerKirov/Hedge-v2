package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.source.ImportImage
import com.heerkirov.hedge.server.utils.ktorm.composition
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object ImportImages : BaseTable<ImportImage>("import_image") {
    val id = int("id").primaryKey()
    val fileId = int("file_id")
    val fileName = varchar("file_name")
    val filePath = varchar("file_path")
    val fileCreateTime = datetime("file_create_time")
    val fileUpdateTime = datetime("file_update_time")
    val fileImportTime = datetime("file_import_time")
    val fileFromSource = json("file_from_source", typeRef<List<String>>())
    val tagme = composition<Illust.Tagme>("tagme")
    val source = varchar("source")
    val sourceId = long("source_id")
    val sourcePart = int("source_part")
    val partitionTime = date("partition_time")
    val orderTime = long("order_time")
    val createTime = datetime("create_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = ImportImage(
        id = row[id]!!,
        fileId = row[fileId]!!,
        fileName = row[fileName],
        filePath = row[filePath],
        fileCreateTime = row[fileCreateTime],
        fileUpdateTime = row[fileUpdateTime],
        fileImportTime = row[fileImportTime]!!,
        fileFromSource = row[fileFromSource],
        tagme = row[tagme]!!,
        source = row[source],
        sourceId = row[sourceId],
        sourcePart = row[sourcePart],
        partitionTime = row[partitionTime]!!,
        orderTime = row[orderTime]!!,
        createTime = row[createTime]!!
    )
}