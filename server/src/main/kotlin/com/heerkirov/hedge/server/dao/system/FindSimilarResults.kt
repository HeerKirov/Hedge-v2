package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.model.system.FindSimilarResult
import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object FindSimilarResults : BaseTable<FindSimilarResult>("find_similar_result", schema = "system_db") {
    val id = int("id").primaryKey()
    val key = text("key")
    val type = enum("type", typeRef<FindSimilarResult.Type>())
    val imageIds = json("image_ids", typeRef<List<Int>>())
    val ordered = int("ordered")
    val recordTime = datetime("record_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = FindSimilarResult(
        id = row[id]!!,
        key = row[key]!!,
        type = row[type]!!,
        imageIds = row[imageIds]!!,
        ordered = row[ordered]!!,
        recordTime = row[recordTime]!!
    )
}