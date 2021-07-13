package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourceTag
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object SourceTags : BaseTable<SourceTag>("source_tag", schema = "source_db") {
    val id = int("id").primaryKey()
    val source = varchar("source")
    val name = varchar("name")
    val displayName = varchar("display_name")
    val type = varchar("type")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceTag(
        id = row[id]!!,
        source = row[source]!!,
        name = row[name]!!,
        displayName = row[displayName],
        type = row[type]
    )
}