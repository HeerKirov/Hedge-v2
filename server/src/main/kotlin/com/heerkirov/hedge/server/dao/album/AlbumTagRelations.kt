package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.model.album.AlbumTagRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

open class AlbumTagRelations(alias: String?) : EntityMetaRelationTable<AlbumTagRelation>("album_tag_relation") {
    companion object : AlbumTagRelations(null)
    override fun aliased(alias: String) = AlbumTagRelations(alias)

    val albumId = int("album_id")
    val tagId = int("tag_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = albumId
    override fun metaId(): Column<Int> = tagId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumTagRelation(
        albumId = row[albumId]!!,
        tagId = row[tagId]!!,
        isExported = row[isExported]!!
    )
}
