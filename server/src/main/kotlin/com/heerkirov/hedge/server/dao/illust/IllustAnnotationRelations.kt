package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.dao.types.EntityAnnotationRelationTable
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.illust.IllustAnnotationRelation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

open class IllustAnnotationRelations(alias: String?) : EntityAnnotationRelationTable<IllustAnnotationRelation>("illust_annotation_relation", alias = alias) {
    companion object : IllustAnnotationRelations(null)
    override fun aliased(alias: String) = IllustAnnotationRelations(alias)

    val illustId = int("illust_id")
    val annotationId = int("annotation_id")
    val exportedFrom = composition<Annotation.ExportedFrom>("exported_from")

    override fun entityId(): Column<Int> = illustId
    override fun annotationId(): Column<Int> = annotationId
    override fun exported(): Column<Annotation.ExportedFrom> = exportedFrom

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustAnnotationRelation(
        illustId = row[illustId]!!,
        annotationId = row[annotationId]!!,
        exportedFrom = row[exportedFrom]!!
    )
}