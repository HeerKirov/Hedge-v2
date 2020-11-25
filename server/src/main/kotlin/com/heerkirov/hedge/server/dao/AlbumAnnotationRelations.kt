package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.AlbumAnnotationRelation
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object AlbumAnnotationRelations : BaseTable<AlbumAnnotationRelation>("album_annotation_relation") {
    val albumId = int("album_id")
    val annotationId = int("annotation_id")
    val exportedFrom = composition<Annotation.ExportedFrom>("exported_from")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AlbumAnnotationRelation(
        albumId = row[albumId]!!,
        annotationId = row[annotationId]!!,
        exportedFrom = row[exportedFrom]!!
    )
}