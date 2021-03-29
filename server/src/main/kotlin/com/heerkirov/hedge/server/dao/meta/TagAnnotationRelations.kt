package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.model.meta.TagAnnotationRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.Column
import org.ktorm.schema.int

object TagAnnotationRelations : MetaAnnotationRelationTable<TagAnnotationRelation>("tag_annotation_relation", schema = "meta_db") {
    val tagId = int("tag_id")
    val annotationId = int("annotation_id")

    override fun metaId(): Column<Int> = tagId
    override fun annotationId(): Column<Int> = annotationId

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = TagAnnotationRelation(
        tagId = row[tagId]!!,
        annotationId = row[annotationId]!!
    )
}
