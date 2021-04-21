package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.model.album.AlbumImageRelation
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.int
import org.ktorm.schema.typeRef
import org.ktorm.schema.varchar

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
