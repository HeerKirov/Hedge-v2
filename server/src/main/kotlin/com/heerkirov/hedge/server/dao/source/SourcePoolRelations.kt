package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourcePoolRelation
import com.heerkirov.hedge.server.model.source.SourceTagRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

open class SourcePoolRelations(alias: String?) : BaseTable<SourcePoolRelation>("source_pool_relation", schema = "source_db", alias = alias) {
    companion object : SourcePoolRelations(null)
    override fun aliased(alias: String) = SourcePoolRelations(alias)

    val sourceId = int("source_id")
    val poolId = int("pool_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourcePoolRelation(
        sourceId = row[sourceId]!!,
        poolId = row[poolId]!!
    )
}