package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.model.album.AlbumTopicRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.boolean
import org.ktorm.schema.int

open class AlbumTopicRelations(alias: String?) : EntityMetaRelationTable<AlbumTopicRelation>("album_topic_relation") {
    companion object : AlbumTopicRelations(null)
    override fun aliased(alias: String) = AlbumTopicRelations(alias)

    val albumId = int("album_id")
    val topicId = int("topic_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = albumId
    override fun metaId(): Column<Int> = topicId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumTopicRelation(
        albumId = row[albumId]!!,
        topicId = row[topicId]!!,
        isExported = row[isExported]!!
    )
}
