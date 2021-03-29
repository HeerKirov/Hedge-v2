package com.heerkirov.hedge.server.dao.collection

import com.heerkirov.hedge.server.model.collection.Folder
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.datetime
import org.ktorm.schema.int
import org.ktorm.schema.varchar

object Folders : BaseTable<Folder>("folder") {
    val id = int("id").primaryKey()
    val title = varchar("title")
    val query = varchar("query")
    val pin = int("pin")
    val cachedCount = int("cached_count")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Folder(
        id = row[id]!!,
        title = row[title]!!,
        query = row[query],
        pin = row[pin],
        cachedCount = row[cachedCount]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}