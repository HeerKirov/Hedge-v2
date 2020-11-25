package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.model.IllustAnnotationRelation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object IllustAnnotationRelations : BaseTable<IllustAnnotationRelation>("illust_annotation_relation") {
    val illustId = int("illust_id")
    val annotationId = int("annotation_id")
    val exportedFrom = composition<Annotation.ExportedFrom>("exported_from")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustAnnotationRelation(
        illustId = row[illustId]!!,
        annotationId = row[annotationId]!!,
        exportedFrom = row[exportedFrom]!!
    )
}