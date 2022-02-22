package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object SourceImages : BaseTable<SourceImage>("source_image", schema = "source_db") {
    val id = int("id").primaryKey()
    val source = varchar("source")
    val sourceId = long("source_id")
    val title = varchar("title")
    val description = varchar("description")
    val relations = json("relations", typeRef<List<Int>>())
    val cachedCount = json("cached_count", typeRef<SourceImage.SourceCount>())
    val empty = boolean("empty")
    val status = enum("status", typeRef<SourceImage.Status>())
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceImage(
        id = row[id]!!,
        source = row[source]!!,
        sourceId = row[sourceId]!!,
        title = row[title],
        description = row[description],
        relations = row[relations],
        cachedCount = row[cachedCount]!!,
        empty = row[empty]!!,
        status = row[status]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}