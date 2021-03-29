package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourceTagMapping
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.int
import org.ktorm.schema.typeRef
import org.ktorm.schema.varchar

object SourceTagMappings : BaseTable<SourceTagMapping>("source_tag_mapping", schema = "source_db") {
    val id = int("id").primaryKey()
    val source = varchar("source")
    val sourceTagType = varchar("source_tag_type")
    val sourceTag = varchar("source_tag")
    val targetTagType = enum("target_tag_type", typeRef<SourceTagMapping.TargetTagType>())
    val targetTagId = int("target_tag_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceTagMapping(
        id = row[id]!!,
        source = row[source],
        sourceTagType = row[sourceTagType],
        sourceTag = row[sourceTag]!!,
        targetTagType = row[targetTagType]!!,
        targetTagId = row[targetTagId]!!
    )
}