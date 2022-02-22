package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourcePool
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object SourcePools : BaseTable<SourcePool>("source_pool", schema = "source_db") {
    val id = int("id").primaryKey()
    val source = varchar("source")
    val key = varchar("key")
    val title = varchar("title")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourcePool(
        id = row[id]!!,
        source = row[source]!!,
        key = row[key]!!,
        title = row[title]!!
    )
}