package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.model.TagAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

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
