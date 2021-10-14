package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.AlbumExporterTask
import com.heerkirov.hedge.server.components.backend.IllustExporterTask
import com.heerkirov.hedge.server.components.backend.EntityExporter
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.components.kit.TopicKit
import com.heerkirov.hedge.server.components.manager.SourceMappingManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumTopicRelations
import com.heerkirov.hedge.server.dao.illust.IllustTopicRelations
import com.heerkirov.hedge.server.dao.meta.TopicAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class TopicService(private val data: DataRepository,
                   private val kit: TopicKit,
                   private val queryManager: QueryManager,
                   private val sourceMappingManager: SourceMappingManager,
                   private val entityExporter: EntityExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Topics.id
        "name" to Topics.name
        "score" to Topics.score nulls last
        "count" to Topics.cachedCount nulls last
        "createTime" to Topics.createTime
        "updateTime" to Topics.updateTime
    }

    fun list(filter: TopicFilter): ListResult<TopicRes> {
        return data.db.from(Topics)
            .let {
                if(filter.annotationIds.isNullOrEmpty()) it else {
                    var joinCount = 0
                    filter.annotationIds.fold(it) { acc, id ->
                        val j = TopicAnnotationRelations.aliased("AR_${++joinCount}")
                        acc.innerJoin(j, (j.topicId eq Topics.id) and (j.annotationId eq id))
                    }
                }
            }
            .select()
            .whereWithConditions {
                if(filter.favorite != null) { it += Topics.favorite eq filter.favorite }
                if(filter.type != null) { it += Topics.type eq filter.type }
                if(filter.parentId != null) { it += Topics.parentId eq filter.parentId }
                if(filter.search != null) { it += (Topics.name like "%${filter.search}%") or (Topics.otherNames like "%${filter.search}%") }
            }
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("id"))
            .limit(filter.offset, filter.limit)
            .toListResult { newTopicRes(Topics.createEntity(it), data.metadata.meta.topicColors) }
    }

    /**
     * @throws AlreadyExists ("Topic", "name", string) 此名称的topic已存在
     * @throws RecursiveParentError parentId出现闭环
     * @throws IllegalConstraintError ("type", "parent", TopicType[]) 当前的type与parent的type不兼容。给出parent的type
     * @throws ResourceNotExist ("parentId", number) 给出的parent不存在。给出parentId
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     */
    fun create(form: TopicCreateForm): Int {
        data.db.transaction {
            val name = kit.validateName(form.name)
            val otherNames = kit.validateOtherNames(form.otherNames)
            val keywords = kit.validateKeywords(form.keywords)

            val parentId = form.parentId?.apply { kit.validateParentType(this, form.type) }

            val annotations = kit.validateAnnotations(form.annotations, form.type)

            val createTime = DateTime.now()

            val id = data.db.insertAndGenerateKey(Topics) {
                set(it.name, name)
                set(it.otherNames, otherNames)
                set(it.parentId, parentId)
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
    fun get(id: Int): TopicDetailRes {
        val topic = data.db.sequenceOf(Topics).firstOrNull { it.id eq id } ?: throw be(NotFound())
        val parent = topic.parentId?.let { parentId -> data.db.sequenceOf(Topics).firstOrNull { it.id eq parentId } }
        val mappingSourceTags = sourceMappingManager.query(MetaType.TOPIC, id)
        return newTopicDetailRes(topic, parent, data.metadata.meta.topicColors, mappingSourceTags)
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws AlreadyExists ("Topic", "name", string) 此名称的topic已存在
     * @throws RecursiveParentError parentId出现闭环
     * @throws IllegalConstraintError ("type", "children" | "parent", TopicType[]) 当前的type与parent|children的type不兼容。给出parent|children的type
     * @throws ResourceNotExist ("parentId", number) 给出的parent不存在。给出parentId
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     * @throws ResourceNotExist ("source", string) 更新source mapping tags时给出的source不存在
     */
    fun update(id: Int, form: TopicUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Topics).firstOrNull { it.id eq id } ?: throw be(NotFound())

            val newName = form.name.letOpt { kit.validateName(it, id) }
            val newOtherNames = form.otherNames.letOpt { kit.validateOtherNames(it) }
            val newKeywords = form.keywords.letOpt { kit.validateKeywords(it) }

            val newParentId = if(form.parentId.isPresent || form.type.isPresent) {
                form.parentId.also {
                    it.unwrapOr { record.parentId }?.let { parentId ->
                        kit.validateParentType(parentId, form.type.unwrapOr { record.type }, id)
                    }
                }
            }else undefined()

            form.type.letOpt { type -> kit.checkChildrenType(id, type) }

            val newAnnotations = form.annotations.letOpt { kit.validateAnnotations(it, form.type.unwrapOr { record.type }) }

            form.mappingSourceTags.letOpt { sourceMappingManager.update(MetaType.TOPIC, id, it ?: emptyList()) }

            if(anyOpt(newName, newOtherNames, newKeywords, newParentId, form.type, form.description, form.links, form.favorite, form.score, newAnnotations)) {
                data.db.update(Topics) {
                    where { it.id eq id }
                    newName.applyOpt { set(it.name, this) }
                    newOtherNames.applyOpt { set(it.otherNames, this) }
                    newParentId.applyOpt { set(it.parentId, this) }
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

            if(newAnnotations.isPresent || (newParentId.isPresent && newParentId.value != record.parentId)) {
                //发生关系类变化时，将关联的illust/album重导出
                data.db.from(IllustTopicRelations)
                    .select(IllustTopicRelations.illustId)
                    .where { IllustTopicRelations.topicId eq id }
                    .map { IllustExporterTask(it[IllustTopicRelations.illustId]!!, exportMeta = true, exportDescription = false, exportFirstCover = false, exportScore = false) }
                    .let { entityExporter.appendNewTask(it) }
                data.db.from(AlbumTopicRelations)
                    .select(AlbumTopicRelations.albumId)
                    .where { AlbumTopicRelations.topicId eq id }
                    .map { AlbumExporterTask(it[AlbumTopicRelations.albumId]!!, exportMeta = true) }
                    .let { entityExporter.appendNewTask(it) }

                queryManager.flushCacheOf(QueryManager.CacheType.TOPIC)
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Topics) { it.id eq id }.let {
                if(it <= 0) throw be(NotFound())
            }
            data.db.delete(IllustTopicRelations) { it.topicId eq id }
            data.db.delete(AlbumTopicRelations) { it.topicId eq id }
            data.db.delete(TopicAnnotationRelations) { it.topicId eq id }
            data.db.update(Topics) {
                //删除topic时，不会像tag那样递归删除子标签，而是将子标签的parent设为null。
                where { it.parentId eq id }
                set(it.parentId, null)
            }

            queryManager.flushCacheOf(QueryManager.CacheType.TOPIC)
        }
    }
}