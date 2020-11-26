package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Folder
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.datetime
import me.liuwj.ktorm.schema.int
import me.liuwj.ktorm.schema.varchar

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