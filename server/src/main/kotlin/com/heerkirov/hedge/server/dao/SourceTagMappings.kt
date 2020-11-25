package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.SourceTagMapping
import com.heerkirov.hedge.server.utils.ktorm.enum
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int
import me.liuwj.ktorm.schema.typeRef
import me.liuwj.ktorm.schema.varchar

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