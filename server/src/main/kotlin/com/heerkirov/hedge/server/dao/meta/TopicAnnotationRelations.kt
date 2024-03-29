package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.model.meta.TopicAnnotationRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.int

open class TopicAnnotationRelations(alias: String?) : MetaAnnotationRelationTable<TopicAnnotationRelation>("topic_annotation_relation", schema = "meta_db", alias = alias) {
    companion object : TopicAnnotationRelations(null)
    override fun aliased(alias: String) = TopicAnnotationRelations(alias)

    val topicId = int("topic_id")
    val annotationId = int("annotation_id")

    override fun metaId(): Column<Int> = topicId
    override fun annotationId(): Column<Int> = annotationId

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = TopicAnnotationRelation(
        topicId = row[topicId]!!,
        annotationId = row[annotationId]!!
    )
}
