package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.model.album.Album
import com.heerkirov.hedge.server.utils.ktorm.json
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Albums : BaseTable<Album>("album") {
    val id = int("id").primaryKey()
    val title = varchar("title")
    val description = varchar("description")
    val score = int("score")
    val favorite = boolean("favorite")
    val fileId = int("file_id")
    val cachedCount = int("cached_count")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Album(
        id = row[id]!!,
        title = row[title]!!,
        description = row[description]!!,
        score = row[score],
        favorite = row[favorite]!!,
        fileId = row[fileId],
        cachedCount = row[cachedCount]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}