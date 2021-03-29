package com.heerkirov.hedge.server.library.quarantine

import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.long
import org.ktorm.schema.varchar

object LSQuarantineEvents : BaseTable<LSQuarantineEvent>("LSQuarantineEvent") {
    val timestamp = long("LSQuarantineTimeStamp")
    val dataURL = varchar("LSQuarantineDataURLString")
    val originURL = varchar("LSQuarantineOriginURLString")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = LSQuarantineEvent(
        timestamp = row[timestamp]!!,
        dataURL = row[dataURL]!!,
        originURL = row[originURL]
    )
}