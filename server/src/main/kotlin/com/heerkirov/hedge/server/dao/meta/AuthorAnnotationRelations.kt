package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.model.meta.AuthorAnnotationRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.int

open class AuthorAnnotationRelations(alias: String?) : MetaAnnotationRelationTable<AuthorAnnotationRelation>("author_annotation_relation", schema = "meta_db") {
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
