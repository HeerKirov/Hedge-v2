package com.heerkirov.hedge.server.dao.collection

import com.heerkirov.hedge.server.model.collection.Folder
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object Folders : BaseTable<Folder>("folder") {
    val id = int("id").primaryKey()
    val title = varchar("title")
    val type = enum("type", typeRef<Folder.FolderType>())
    val parentId = int("parent_id")
    val parentAddress = json("parent_address", typeRef<List<String>>())
    val ordinal = int("ordinal")
    val pin = int("pin")
    val query = varchar("query")
    val cachedCount = int("cached_count")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Folder(
        id = row[id]!!,
        title = row[title]!!,
        type = row[type]!!,
        parentId = row[parentId],
        parentAddress = row[parentAddress],
        ordinal = row[ordinal]!!,
        pin = row[pin],
        query = row[query],
        cachedCount = row[cachedCount],
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}