package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.TargetAnnotationRelationTable
import com.heerkirov.hedge.server.model.TopicAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

object TopicAnnotationRelations : TargetAnnotationRelationTable<TopicAnnotationRelation>("topic_annotation_relation", schema = "meta_db") {
    val topicId = int("topic_id")
    val annotationId = int("annotation_id")

    override fun targetId(): Column<Int> = topicId
    override fun annotationId(): Column<Int> = annotationId

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = TopicAnnotationRelation(
        topicId = row[topicId]!!,
        annotationId = row[annotationId]!!
    )
}
