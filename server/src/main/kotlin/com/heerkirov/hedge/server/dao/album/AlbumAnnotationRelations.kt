package com.heerkirov.hedge.server.dao.album

import com.heerkirov.hedge.server.dao.types.EntityAnnotationRelationTable
import com.heerkirov.hedge.server.model.album.AlbumAnnotationRelation
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

open class AlbumAnnotationRelations(alias: String?) : EntityAnnotationRelationTable<AlbumAnnotationRelation>("album_annotation_relation") {
    companion object : AlbumAnnotationRelations(null)
    override fun aliased(alias: String) = AlbumAnnotationRelations(alias)

    val albumId = int("album_id")
    val annotationId = int("annotation_id")
    val exportedFrom = composition<Annotation.ExportedFrom>("exported_from")

    override fun entityId(): Column<Int> = albumId
    override fun annotationId(): Column<Int> = annotationId
    override fun exported(): Column<Annotation.ExportedFrom> = exportedFrom

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumAnnotationRelation(
        albumId = row[albumId]!!,
        annotationId = row[annotationId]!!,
        exportedFrom = row[exportedFrom]!!
    )
}