package com.heerkirov.hedge.server.dao.collection

import com.heerkirov.hedge.server.model.collection.Partition
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.date
import org.ktorm.schema.int

object Partitions : BaseTable<Partition>("partition") {
    val date = date("date").primaryKey()
    val cachedCount = int("cached_count")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Partition(
        date = row[date]!!,
        cachedCount = row[cachedCount]!!
    )
}