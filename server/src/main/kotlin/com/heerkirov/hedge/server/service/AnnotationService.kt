package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.manager.AnnotationManager
import com.heerkirov.hedge.server.utils.anyOpt
import com.heerkirov.hedge.server.utils.ktorm.contains
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf

class AnnotationService(private val data: DataRepository, private val annotationMgr: AnnotationManager) {
    fun list(filter: AnnotationFilter): ListResult<AnnotationRes> {
        return data.db.from(Annotations).select()
            .whereWithConditions {
                if(filter.canBeExported != null) { it += Annotations.canBeExported eq filter.canBeExported }
                if(filter.target != null) { it += Annotations.target contains filter.target }
            }
            .limit(filter.offset, filter.limit)
            .toListResult { newAnnotationRes(Annotations.createEntity(it)) }
    }

    fun create(form: AnnotationCreateForm): Int {
        data.db.transaction {
            val name = annotationMgr.validateName(form.name)
            return data.db.insertAndGenerateKey(Annotations) {
                set(it.name, name)
                set(it.canBeExported, form.canBeExported)
                set(it.target, form.target)
            } as Int
        }
    }

    fun get(id: Int): AnnotationRes {
        return data.db.sequenceOf(Annotations).firstOrNull { it.id eq id }
            ?.let { newAnnotationRes(it) }
            ?: throw NotFound()
    }

    fun update(id: Int, form: AnnotationUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Annotations).firstOrNull { it.id eq id } ?: throw NotFound()

            val newName = form.name.letOpt { annotationMgr.validateName(it, id) }
            if(anyOpt(newName, form.canBeExported, form.target)) {
                data.db.update(Annotations) {
                    where { it.id eq id }

                    newName.applyOpt { set(it.name, this) }
                    form.canBeExported.applyOpt { set(it.canBeExported, this) }
                    form.target.applyOpt { set(it.target, this) }
                }
            }
        }
    }

    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Annotations) { it.id eq id }.let {
                if(it <= 0) NotFound()
            }
            data.db.delete(IllustAnnotationRelations) { it.annotationId eq id }
            data.db.delete(AlbumAnnotationRelations) { it.annotationId eq id }
            data.db.delete(TagAnnotationRelations) { it.annotationId eq id }

            annotationMgr.updateAnnotationCacheForDelete(id)
            data.db.delete(AuthorAnnotationRelations) { it.annotationId eq id }
            data.db.delete(TopicAnnotationRelations) { it.annotationId eq id }
        }
    }
}