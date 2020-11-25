package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.AlbumTopicRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

object AlbumTopicRelations : BaseTable<AlbumTopicRelation>("album_topic_relation") {
    val albumId = int("album_id")
    val topicId = int("topic_id")
    val isExported = boolean("is_exported")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumTopicRelation(
        albumId = row[albumId]!!,
        topicId = row[topicId]!!,
        isExported = row[isExported]!!
    )
}
