package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourceTagRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

open class SourceTagRelations(alias: String?) : BaseTable<SourceTagRelation>("source_tag_relation", schema = "source_db", alias = alias) {
    companion object : SourceTagRelations(null)
    override fun aliased(alias: String) = SourceTagRelations(alias)

    val sourceId = int("source_id")
    val tagId = int("tag_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceTagRelation(
        sourceId = row[sourceId]!!,
        tagId = row[tagId]!!
    )
}