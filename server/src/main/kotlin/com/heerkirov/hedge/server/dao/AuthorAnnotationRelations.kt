package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.AuthorAnnotationRelation
import com.heerkirov.hedge.server.model.TopicAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object AuthorAnnotationRelations : BaseTable<AuthorAnnotationRelation>("author_annotation_relation", schema = "meta_db") {
    val authorId = int("author_id")
    val annotationId = int("annotation_id")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AuthorAnnotationRelation(
        authorId = row[authorId]!!,
        annotationId = row[annotationId]!!
    )
}
