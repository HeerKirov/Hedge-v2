package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Album
import com.heerkirov.hedge.server.utils.ktorm.json
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Albums : BaseTable<Album>("album") {
    val id = int("id").primaryKey()
    val title = varchar("title")
    val description = varchar("description")
    val score = int("score")
    val favorite = boolean("favorite")
    val subtitles = json("subtitles", typeRef<List<Album.Subtitle>>())
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Album(
        id = row[id]!!,
        title = row[title]!!,
        description = row[description]!!,
        score = row[score],
        favorite = row[favorite]!!,
        subtitles = row[subtitles],
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}