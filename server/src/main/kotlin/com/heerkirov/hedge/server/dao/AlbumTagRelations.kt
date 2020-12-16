package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.EntityTargetRelationTable
import com.heerkirov.hedge.server.model.AlbumTagRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

object AlbumTagRelations : EntityTargetRelationTable<AlbumTagRelation>("album_tag_relation") {
    val albumId = int("album_id")
    val tagId = int("tag_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = albumId
    override fun targetId(): Column<Int> = tagId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumTagRelation(
        albumId = row[albumId]!!,
        tagId = row[tagId]!!,
        isExported = row[isExported]!!
    )
}
