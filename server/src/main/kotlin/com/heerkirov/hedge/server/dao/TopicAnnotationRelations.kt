package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.TopicAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object TopicAnnotationRelations : BaseTable<TopicAnnotationRelation>("topic_annotation_relation", schema = "meta_db") {
    val topicId = int("topic_id")
    val annotationId = int("annotation_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = TopicAnnotationRelation(
        topicId = row[topicId]!!,
        annotationId = row[annotationId]!!
    )
}
