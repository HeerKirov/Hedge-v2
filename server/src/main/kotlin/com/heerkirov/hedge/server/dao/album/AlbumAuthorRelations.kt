package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.model.album.AlbumAuthorRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.boolean
import org.ktorm.schema.int

open class AlbumAuthorRelations(alias: String?) : EntityMetaRelationTable<AlbumAuthorRelation>("album_author_relation") {
    companion object : AlbumAuthorRelations(null)
    override fun aliased(alias: String) = AlbumAuthorRelations(alias)

    val albumId = int("album_id")
    val authorId = int("author_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = albumId
    override fun metaId(): Column<Int> = authorId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumAuthorRelation(
        albumId = row[albumId]!!,
        authorId = row[authorId]!!,
        isExported = row[isExported]!!
    )
}
