package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.tools.checkTagName
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.runIf
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.any
import me.liuwj.ktorm.entity.sequenceOf

class AnnotationKit(private val data: DataRepository) {
    /**
     * 校验并纠正name，同时对name进行查重。
     * @param thisId 指定此参数时，表示是在对一个项进行更新，此时绕过此id的记录的重名。
     */
    fun validateName(newName: String, thisId: Int? = null): String {
        return newName.trim().apply {
            if(!checkTagName(this)) throw ParamError("name")
            if(data.db.sequenceOf(Annotations).any { (it.name eq newName).runIf(thisId != null) { and (it.id notEq thisId!!) } })
                throw AlreadyExists("Annotation", "name", newName)
        }
    }

    /**
     * 更新与此annotation关联的author/topic的annotation cache，删除当前注解。
     */
    fun updateAnnotationCacheForDelete(annotationId: Int) {
        val authors = data.db.from(Authors)
            .innerJoin(AuthorAnnotationRelations, AuthorAnnotationRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.cachedAnnotations)
            .where { AuthorAnnotationRelations.annotationId eq annotationId }
            .asSequence()
            .map { Pair(it[Authors.id]!!, it[Authors.cachedAnnotations]!!) }
            .map { (id, cache) -> Pair(id, cache.filter { it.id != annotationId }) }
            .toMap()
        data.db.batchUpdate(Authors) {
            for ((id, cache) in authors) {
                item {
                    where { it.id eq id }
                    set(it.cachedAnnotations, cache)
                }
            }
        }

        val topics = data.db.from(Topics)
            .innerJoin(TopicAnnotationRelations, TopicAnnotationRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.cachedAnnotations)
            .where { TopicAnnotationRelations.annotationId eq annotationId }
            .asSequence()
            .map { Pair(it[Topics.id]!!, it[Topics.cachedAnnotations]!!) }
            .map { (id, cache) -> Pair(id, cache.filter { it.id != annotationId }) }
            .toMap()
        data.db.batchUpdate(Topics) {
            for ((id, cache) in topics) {
                item {
                    where { it.id eq id }
                    set(it.cachedAnnotations, cache)
                }
            }
        }
    }
}