package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.model.system.HistoryRecord
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object HistoryRecords : BaseTable<HistoryRecord>("history_record", schema = "system_db") {
    val sequenceId = long("sequence_id")
    val type = enum("type", typeRef<HistoryRecord.Type>())
    val key = varchar("key")
    val recordTime = long("record_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = HistoryRecord(
        sequenceId = row[sequenceId]!!,
        type = row[type]!!,
        key = row[key]!!,
        recordTime = row[recordTime]!!
    )
}