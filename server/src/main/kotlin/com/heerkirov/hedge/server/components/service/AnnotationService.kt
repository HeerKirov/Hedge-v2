package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AnnotationKit
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumAnnotationRelations
import com.heerkirov.hedge.server.dao.illust.IllustAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.AuthorAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.TagAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.TopicAnnotationRelations
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.ktorm.compositionContains
import com.heerkirov.hedge.server.utils.ktorm.compositionEmpty
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.ascendingOrderItem
import com.heerkirov.hedge.server.utils.types.toListResult
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class AnnotationService(private val data: DataRepository, private val kit: AnnotationKit, private val queryManager: QueryManager) {
    private val orderTranslator = OrderTranslator {
        "id" to Annotations.id
        "name" to Annotations.name
        "createTime" to Annotations.createTime
    }

    fun list(filter: AnnotationFilter): ListResult<AnnotationRes> {
        return data.db.from(Annotations).select()
            .whereWithConditions {
                if(filter.name != null) { it += Annotations.name eq filter.name }
                if(filter.canBeExported != null) { it += Annotations.canBeExported eq filter.canBeExported }
                if(filter.target != null) { it += (Annotations.target compositionContains filter.target) or Annotations.target.compositionEmpty() }
                if(filter.search != null) { it += Annotations.name like "%${filter.search}%" }
            }
            .limit(filter.offset, filter.limit)
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("id"))
            .toListResult { newAnnotationRes(Annotations.createEntity(it)) }
    }

    /**
     * @throws AlreadyExists ("Annotation", "name", string) 此名称的annotation已存在
     */
    fun create(form: AnnotationCreateForm): Int {
        data.db.transaction {
            val createTime = DateTime.now()
            val name = kit.validateName(form.name)
            return data.db.insertAndGenerateKey(Annotations) {
                set(it.name, name)
                set(it.canBeExported, form.canBeExported)
                set(it.target, form.target)
                set(it.createTime, createTime)
            } as Int
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): AnnotationRes {
        return data.db.sequenceOf(Annotations).firstOrNull { it.id eq id }
            ?.let { newAnnotationRes(it) }
            ?: throw be(NotFound())
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws AlreadyExists ("Annotation", "name", string) 此名称的annotation已存在
     */
    fun update(id: Int, form: AnnotationUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Annotations).firstOrNull { it.id eq id } ?: throw be(NotFound())

            val newName = form.name.letOpt { kit.validateName(it, id) }
            if(anyOpt(newName, form.canBeExported, form.target)) {
                data.db.update(Annotations) {
                    where { it.id eq id }

                    newName.applyOpt { set(it.name, this) }
                    form.canBeExported.applyOpt { set(it.canBeExported, this) }
                    form.target.applyOpt { set(it.target, this) }
                }

                queryManager.flushCacheOf(QueryManager.CacheType.ANNOTATION)
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Annotations) { it.id eq id }.let {
                if(it <= 0) throw be(NotFound())
            }
            data.db.delete(IllustAnnotationRelations) { it.annotationId eq id }
            data.db.delete(AlbumAnnotationRelations) { it.annotationId eq id }
            data.db.delete(TagAnnotationRelations) { it.annotationId eq id }

            kit.updateAnnotationCacheForDelete(id)
            data.db.delete(AuthorAnnotationRelations) { it.annotationId eq id }
            data.db.delete(TopicAnnotationRelations) { it.annotationId eq id }

            queryManager.flushCacheOf(QueryManager.CacheType.ANNOTATION)
        }
    }
}