package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.enums.MetaType
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
    val sourceTagId = int("source_tag_id")
    val targetMetaType = enum("target_meta_type", typeRef<MetaType>())
    val targetMetaId = int("target_tag_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceTagMapping(
        id = row[id]!!,
        source = row[source]!!,
        sourceTagId = row[sourceTagId]!!,
        targetMetaType = row[targetMetaType]!!,
        targetMetaId = row[targetMetaId]!!
    )
}