package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.ktorm.composition
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object Illusts : BaseTable<Illust>("illust") {
    val id = int("id").primaryKey()
    val type = enum("type", typeRef<Illust.Type>())
    val parentId = int("parent_id")
    val fileId = int("file_id")
    val cachedChildrenCount = int("cached_children_count")
    val sourceImageId = int("source_image_id")
    val source = varchar("source")
    val sourceId = long("source_id")
    val sourcePart = int("source_part")
    val description = varchar("description")
    val score = int("score")
    val favorite = boolean("favorite")
    val tagme = composition<Illust.Tagme>("tagme")
    val associateId = int("associate_id")
    val exportedDescription = varchar("exported_description")
    val exportedScore = int("exported_score")
    val partitionTime = date("partition_time")
    val orderTime = long("order_time")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Illust(
        id = row[id]!!,
        type = row[type]!!,
        parentId = row[parentId],
        fileId = row[fileId]!!,
        cachedChildrenCount = row[cachedChildrenCount]!!,
        sourceImageId = row[sourceImageId],
        source = row[source],
        sourceId = row[sourceId],
        sourcePart = row[sourcePart],
        description = row[description]!!,
        score = row[score],
        favorite = row[favorite]!!,
        tagme = row[tagme]!!,
        associateId = row[associateId],
        exportedDescription = row[exportedDescription]!!,
        exportedScore = row[exportedScore],
        partitionTime = row[partitionTime]!!,
        orderTime = row[orderTime]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}