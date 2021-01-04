package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.model.album.AlbumImageRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object AlbumImageRelations : BaseTable<AlbumImageRelation>("album_image_relation") {
    val albumId = int("album_id")
    val imageId = int("image_id")
    val ordinal = int("ordinal")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumImageRelation(
        albumId = row[albumId]!!,
        imageId = row[imageId]!!,
        ordinal = row[ordinal]!!
    )
}
