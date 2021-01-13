package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.model.album.AlbumImageRelation
import com.heerkirov.hedge.server.utils.ktorm.enum
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int
import me.liuwj.ktorm.schema.typeRef
import me.liuwj.ktorm.schema.varchar

object AlbumImageRelations : BaseTable<AlbumImageRelation>("album_image_relation") {
    val albumId = int("album_id")
    val type = enum("type", typeRef<AlbumImageRelation.Type>())
    val imageId = int("image_id")
    val subtitle = varchar("subtitle")
    val ordinal = int("ordinal")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumImageRelation(
        albumId = row[albumId]!!,
        type = row[type]!!,
        imageId = row[imageId]!!,
        subtitle = row[subtitle],
        ordinal = row[ordinal]!!
    )
}
