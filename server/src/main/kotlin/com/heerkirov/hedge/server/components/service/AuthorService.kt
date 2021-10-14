package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.AlbumExporterTask
import com.heerkirov.hedge.server.components.backend.IllustExporterTask
import com.heerkirov.hedge.server.components.backend.EntityExporter
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AuthorKit
import com.heerkirov.hedge.server.components.manager.SourceMappingManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumAuthorRelations
import com.heerkirov.hedge.server.dao.illust.IllustAuthorRelations
import com.heerkirov.hedge.server.dao.meta.AuthorAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class AuthorService(private val data: DataRepository,
                    private val kit: AuthorKit,
                    private val queryManager: QueryManager,
                    private val sourceMappingManager: SourceMappingManager,
                    private val entityExporter: EntityExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Authors.id
        "name" to Authors.name
        "score" to Authors.score nulls last
        "count" to Authors.cachedCount nulls last
        "createTime" to Authors.createTime
        "updateTime" to Authors.updateTime
    }

    fun list(filter: AuthorFilter): ListResult<AuthorRes> {
        val authorColors = data.metadata.meta.authorColors

        return data.db.from(Authors)
            .let {
                if(filter.annotationIds.isNullOrEmpty()) it else {
                    var joinCount = 0
                    filter.annotationIds.fold(it) { acc, id ->
                        val j = AuthorAnnotationRelations.aliased("AR_${++joinCount}")
                        acc.innerJoin(j, (j.authorId eq Authors.id) and (j.annotationId eq id))
                    }
                }
            }
            .select()
            .whereWithConditions {
                if(filter.favorite != null) { it += Authors.favorite eq filter.favorite }
                if(filter.type != null) { it += Authors.type eq filter.type }
                if(filter.search != null) { it += (Authors.name like "%${filter.search}%") or (Authors.otherNames like "%${filter.search}%") }
            }
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("id"))
            .limit(filter.offset, filter.limit)
            .toListResult { newAuthorRes(Authors.createEntity(it), authorColors) }
    }

    /**
     * @throws AlreadyExists ("Author", "name", string) 此名称的author已存在
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     */
    fun create(form: AuthorCreateForm): Int {
        data.db.transaction {
            val name = kit.validateName(form.name)
            val otherNames = kit.validateOtherNames(form.otherNames)
            val keywords = kit.validateKeywords(form.keywords)

            val annotations = kit.validateAnnotations(form.annotations, form.type)
            val createTime = DateTime.now()

            val id = data.db.insertAndGenerateKey(Authors) {
                set(it.name, name)
                set(it.otherNames, otherNames)
                set(it.keywords, keywords)
                set(it.description, form.description)
                set(it.type, form.type)
                set(it.links, form.links)
                set(it.favorite, form.favorite)
                set(it.score, form.score)
                set(it.cachedCount, 0)
                set(it.cachedAnnotations, annotations)
                set(it.createTime, createTime)
                set(it.updateTime, createTime)
            } as Int

            kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet(), creating = true)

            return id
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): AuthorDetailRes {
        return data.db.sequenceOf(Authors).firstOrNull { it.id eq id }
            ?.let {
                val mappingSourceTags = sourceMappingManager.query(MetaType.AUTHOR, id)
                newAuthorDetailRes(it, data.metadata.meta.authorColors, mappingSourceTags)
            }
            ?: throw be(NotFound())
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws AlreadyExists ("Author", "name", string) 此名称的author已存在
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     * @throws ResourceNotExist ("source", string) 更新source mapping tags时给出的source不存在
     */
    fun update(id: Int, form: AuthorUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Authors).firstOrNull { it.id eq id } ?: throw be(NotFound())

            val newName = form.name.letOpt { kit.validateName(it, id) }
            val newOtherNames = form.otherNames.letOpt { kit.validateOtherNames(it) }
            val newKeywords = form.keywords.letOpt { kit.validateKeywords(it) }

            val newAnnotations = form.annotations.letOpt { kit.validateAnnotations(it, form.type.unwrapOr { record.type }) }

            form.mappingSourceTags.letOpt { sourceMappingManager.update(MetaType.AUTHOR, id, it ?: emptyList()) }

            if(anyOpt(newName, newOtherNames, newKeywords, form.type, form.description, form.links, form.favorite, form.score, newAnnotations)) {
                data.db.update(Authors) {
                    where { it.id eq id }
                    newName.applyOpt { set(it.name, this) }
                    newOtherNames.applyOpt { set(it.otherNames, this) }
                    newKeywords.applyOpt { set(it.keywords, this) }
                    form.type.applyOpt { set(it.type, this) }
                    form.description.applyOpt { set(it.description, this) }
                    form.links.applyOpt { set(it.links, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                    form.score.applyOpt { set(it.score, this) }
                    newAnnotations.applyOpt { set(it.cachedAnnotations, this) }
                }
            }

            newAnnotations.letOpt { annotations -> kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet()) }

            if(newAnnotations.isPresent) {
                //发生关系类变化时，将关联的illust/album重导出
                data.db.from(IllustAuthorRelations)
                    .select(IllustAuthorRelations.illustId)
                    .where { IllustAuthorRelations.authorId eq id }
                    .map { IllustExporterTask(it[IllustAuthorRelations.illustId]!!, exportMeta = true, exportDescription = false, exportFirstCover = false, exportScore = false) }
                    .let { entityExporter.appendNewTask(it) }
                data.db.from(AlbumAuthorRelations)
                    .select(AlbumAuthorRelations.albumId)
                    .where { AlbumAuthorRelations.authorId eq id }
                    .map { AlbumExporterTask(it[AlbumAuthorRelations.albumId]!!, exportMeta = true) }
                    .let { entityExporter.appendNewTask(it) }

                queryManager.flushCacheOf(QueryManager.CacheType.AUTHOR)
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Authors) { it.id eq id }.let {
                if(it <= 0) throw be(NotFound())
            }
            data.db.delete(IllustAuthorRelations) { it.authorId eq id }
            data.db.delete(AlbumAuthorRelations) { it.authorId eq id }
            data.db.delete(AuthorAnnotationRelations) { it.authorId eq id }

            queryManager.flushCacheOf(QueryManager.CacheType.AUTHOR)
        }
    }
}