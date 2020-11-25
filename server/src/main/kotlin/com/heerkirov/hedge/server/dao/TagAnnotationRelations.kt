package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.TagAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object TagAnnotationRelations : BaseTable<TagAnnotationRelation>("tag_annotation_relation", schema = "meta_db") {
    val tagId = int("tag_id")
    val annotationId = int("annotation_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = TagAnnotationRelation(
        tagId = row[tagId]!!,
        annotationId = row[annotationId]!!
    )
}
