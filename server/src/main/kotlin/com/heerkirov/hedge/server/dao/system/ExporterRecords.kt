package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.model.system.ExporterRecord
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object ExporterRecords : BaseTable<ExporterRecord>("exporter_record", schema = "system_db") {
    val id = int("id").primaryKey()
    val type = int("type")
    val key = varchar("key")
    val content = varchar("content")
    val createTime = datetime("create_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = ExporterRecord(
        id = row[id]!!,
        type = row[type]!!,
        key = row[key]!!,
        content = row[content]!!,
        createTime = row[createTime]!!
    )
}