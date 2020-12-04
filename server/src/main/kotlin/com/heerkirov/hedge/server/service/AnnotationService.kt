package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.AnnotationCreateForm
import com.heerkirov.hedge.server.form.AnnotationRes
import com.heerkirov.hedge.server.form.AnnotationUpdateForm
import com.heerkirov.hedge.server.form.newAnnotationRes
import com.heerkirov.hedge.server.manager.AnnotationManager
import com.heerkirov.hedge.server.utils.anyOpt
import me.liuwj.ktorm.dsl.delete
import me.liuwj.ktorm.dsl.eq
import me.liuwj.ktorm.dsl.insertAndGenerateKey
import me.liuwj.ktorm.dsl.update
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.map
import me.liuwj.ktorm.entity.sequenceOf

class AnnotationService(private val data: DataRepository, private val annotationMgr: AnnotationManager) {
    fun list(): List<AnnotationRes> {
        return data.db.sequenceOf(Annotations).map { newAnnotationRes(it) }
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
            data.db.delete(TagAnnotationRelations) { it.annotationId eq id }
            data.db.delete(TopicAnnotationRelations) { it.annotationId eq id }
            data.db.delete(AuthorAnnotationRelations) { it.annotationId eq id }
            data.db.delete(IllustAnnotationRelations) { it.annotationId eq id }
            data.db.delete(AlbumAnnotationRelations) { it.annotationId eq id }
        }
    }
}