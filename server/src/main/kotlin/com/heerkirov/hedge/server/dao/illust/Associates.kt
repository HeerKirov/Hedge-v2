package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.model.illust.Associate
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.int

object Associates : BaseTable<Associate>("associate") {
    val id = int("id").primaryKey()
    val cachedCount = int("cached_count")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Associate(
        id = row[id]!!,
        cachedCount = row[cachedCount]!!
    )
}