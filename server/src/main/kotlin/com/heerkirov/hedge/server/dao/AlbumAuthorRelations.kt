package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.EntityTargetRelationTable
import com.heerkirov.hedge.server.model.AlbumAuthorRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

object AlbumAuthorRelations : EntityTargetRelationTable<AlbumAuthorRelation>("album_author_relation") {
    val albumId = int("album_id")
    val authorId = int("author_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = albumId
    override fun targetId(): Column<Int> = authorId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumAuthorRelation(
        albumId = row[albumId]!!,
        authorId = row[authorId]!!,
        isExported = row[isExported]!!
    )
}
