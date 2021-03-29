package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.AlbumExporterTask
import com.heerkirov.hedge.server.components.backend.IllustExporterTask
import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.components.kit.TopicKit
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumTopicRelations
import com.heerkirov.hedge.server.dao.illust.IllustTopicRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.TopicAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class TopicService(private val data: DataRepository,
                   private val kit: TopicKit,
                   private val queryManager: QueryManager,
                   private val illustMetaExporter: IllustMetaExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Topics.id
        "name" to Topics.name
        "score" to Topics.exportedScore nulls last
        "count" to Topics.cachedCount nulls last
        "createTime" to Topics.createTime
        "updateTime" to Topics.updateTime
    }

    fun list(filter: TopicFilter): ListResult<TopicRes> {
        val schema = if(filter.query.isNullOrBlank()) null else {
            queryManager.querySchema(filter.query, QueryManager.Dialect.TOPIC).executePlan ?: return ListResult(0, emptyList())
        }
        return data.db.from(Topics)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .select()
            .whereWithConditions {
                if(filter.favorite != null) { it += Topics.favorite eq filter.favorite }
                if(filter.type != null) { it += Topics.type eq filter.type }
                if(filter.parentId != null) { it += Topics.parentId eq filter.parentId }
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(Topics.id) }
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("id"))
            .limit(filter.offset, filter.limit)
            .toListResult { newTopicRes(Topics.createEntity(it)) }
    }

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
                set(it.exportedScore, form.score ?: 0)
                set(it.cachedCount, 0)
                set(it.cachedAnnotations, annotations)
                set(it.createTime, createTime)
                set(it.updateTime, createTime)
            } as Int

            kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet(), creating = true)

            return id
        }
    }

    fun get(id: Int): TopicDetailRes {
        val topic = data.db.sequenceOf(Topics).firstOrNull { it.id eq id } ?: throw NotFound()
        val parent = topic.parentId?.let { parentId -> data.db.sequenceOf(Topics).firstOrNull { it.id eq parentId } }
        return newTopicDetailRes(topic, parent)
    }

    fun update(id: Int, form: TopicUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Topics).firstOrNull { it.id eq id } ?: throw NotFound()

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

            val newExportedScore = form.score.letOpt {
                it ?: data.db.from(Illusts)
                    .innerJoin(IllustTopicRelations, Illusts.id eq IllustTopicRelations.illustId)
                    .select(count(Illusts.exportedScore).aliased("count"))
                    .where { (IllustTopicRelations.topicId eq id) and (Illusts.type eq Illust.Type.IMAGE) or (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
                    .first().getInt("count")
            }

            val newAnnotations = form.annotations.letOpt { kit.validateAnnotations(it, form.type.unwrapOr { record.type }) }

            if(anyOpt(newName, newOtherNames, newKeywords, newParentId, form.type, form.description, form.links, form.favorite, form.score, newExportedScore, newAnnotations)) {
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
                    newExportedScore.applyOpt { set(it.exportedScore, this) }
                    newAnnotations.applyOpt { set(it.cachedAnnotations, this) }
                }
            }


            newAnnotations.letOpt { annotations -> kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet()) }

            if(newAnnotations.isPresent || (newParentId.isPresent && newParentId.value != record.parentId)) {
                //发生关系类变化时，将关联的illust/album重导出
                data.db.from(IllustTopicRelations)
                    .select(IllustTopicRelations.illustId)
                    .where { IllustTopicRelations.topicId eq id }
                    .map { IllustExporterTask(it[IllustTopicRelations.illustId]!!, exportMeta = true, exportDescription = false, exportFileAndTime = false, exportScore = false) }
                    .let { illustMetaExporter.appendNewTask(it) }
                data.db.from(AlbumTopicRelations)
                    .select(AlbumTopicRelations.albumId)
                    .where { AlbumTopicRelations.topicId eq id }
                    .map { AlbumExporterTask(it[AlbumTopicRelations.albumId]!!, exportMeta = true) }
                    .let { illustMetaExporter.appendNewTask(it) }

                queryManager.flushCacheOf(QueryManager.CacheType.TOPIC)
            }
        }
    }

    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Topics) { it.id eq id }.let {
                if(it <= 0) throw NotFound()
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