package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.TargetAnnotationRelationTable
import com.heerkirov.hedge.server.model.AuthorAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

object AuthorAnnotationRelations : TargetAnnotationRelationTable<AuthorAnnotationRelation>("author_annotation_relation", schema = "meta_db") {
    val authorId = int("author_id")
    val annotationId = int("annotation_id")

    override fun targetId(): Column<Int> = authorId
    override fun annotationId(): Column<Int> = annotationId

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AuthorAnnotationRelation(
        authorId = row[authorId]!!,
        annotationId = row[annotationId]!!
    )
}
