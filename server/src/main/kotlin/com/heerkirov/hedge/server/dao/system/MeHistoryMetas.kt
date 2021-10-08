package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.model.system.MeHistoryMeta
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.int
import org.ktorm.schema.long
import org.ktorm.schema.typeRef

object MeHistoryMetas : BaseTable<MeHistoryMeta>("me_history_meta_tag", schema = "system_db") {
    val sequenceId = long("sequence_id")
    val metaType = enum("meta_type", typeRef<MetaType>())
    val metaId = int("meta_id")
    val recordTime = long("record_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = MeHistoryMeta(
        sequenceId = row[sequenceId]!!,
        metaType = row[metaType]!!,
        metaId = row[metaId]!!,
        recordTime = row[recordTime]!!
    )
}