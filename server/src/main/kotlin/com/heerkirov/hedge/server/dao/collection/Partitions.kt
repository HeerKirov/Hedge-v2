package com.heerkirov.hedge.server.dao.collection

import com.heerkirov.hedge.server.model.collection.Partition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.date
import me.liuwj.ktorm.schema.int

object Partitions : BaseTable<Partition>("partition") {
    val date = date("date").primaryKey()
    val cachedCount = int("cached_count")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Partition(
        date = row[date]!!,
        cachedCount = row[cachedCount]!!
    )
}