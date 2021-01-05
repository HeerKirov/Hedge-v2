package com.heerkirov.hedge.server.library.quarantine

import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.long
import me.liuwj.ktorm.schema.varchar

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