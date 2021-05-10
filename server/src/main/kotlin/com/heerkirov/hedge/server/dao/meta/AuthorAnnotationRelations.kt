package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.model.meta.AuthorAnnotationRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.int

open class AuthorAnnotationRelations(alias: String?) : MetaAnnotationRelationTable<AuthorAnnotationRelation>("author_annotation_relation", schema = "meta_db", alias = alias) {
    companion object : AuthorAnnotationRelations(null)
    override fun aliased(alias: String) = AuthorAnnotationRelations(alias)

    val authorId = int("author_id")
    val annotationId = int("annotation_id")

    override fun metaId(): Column<Int> = authorId
    override fun annotationId(): Column<Int> = annotationId

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = AuthorAnnotationRelation(
        authorId = row[authorId]!!,
        annotationId = row[annotationId]!!
    )
}
