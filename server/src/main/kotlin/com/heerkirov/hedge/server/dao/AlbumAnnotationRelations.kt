package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.EntityAnnotationRelationTable
import com.heerkirov.hedge.server.model.AlbumAnnotationRelation
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

object AlbumAnnotationRelations : EntityAnnotationRelationTable<AlbumAnnotationRelation>("album_annotation_relation") {
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