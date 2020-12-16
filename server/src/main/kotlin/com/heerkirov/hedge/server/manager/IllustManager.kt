package com.heerkirov.hedge.server.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.dao.types.EntityTargetRelationTable
import com.heerkirov.hedge.server.dao.types.TargetAnnotationRelationTable
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.first
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import java.time.LocalDate
import java.time.LocalDateTime

class IllustManager(private val data: DataRepository,
                    private val sourceImageMgr: SourceImageManager,
                    private val tagMgr: TagManager,
                    private val authorMgr: AuthorManager,
                    private val topicMgr: TopicManager) {
    /**
     * 创建新的image。
     */
    fun newImage(fileId: Int, collectionId: Int? = null, relations: List<Int>? = null,
                 source: String? = null, sourceId: Long? = null, sourcePart: Int? = null,
                 description: String = "", score: Int? = null, favorite: Boolean = false, tagme: Illust.Tagme = Illust.Tagme.EMPTY,
                 tags: List<Int>? = null, topics: List<Int>? = null, authors: List<Int>? = null,
                 partitionTime: LocalDate, orderTime: Long, createTime: LocalDateTime): Int {
        val collection = if(collectionId == null) null else {
            data.db.sequenceOf(Illusts)
                .firstOrNull { (Illusts.type eq Illust.Type.COLLECTION) and (Illusts.id eq collectionId) }
                ?: throw ResourceNotExist("parentId", collectionId)
        }

        if(relations != null) checkRelations(relations)
        if(source != null) sourceImageMgr.checkSource(source, sourceId, sourcePart)

        val exportedDescription = if(description.isEmpty() && collection != null) collection.exportedDescription else description
        val exportedScore = if(score == null && collection != null) collection.exportedScore else score

        val id = data.db.insertAndGenerateKey(Illusts) {
            set(it.type, if(collection != null) Illust.Type.IMAGE_WITH_PARENT else Illust.Type.IMAGE)
            set(it.parentId, collectionId)
            set(it.fileId, fileId)
            set(it.source, source)
            set(it.sourceId, sourceId)
            set(it.sourcePart, sourcePart)
            set(it.description, description)
            set(it.score, score)
            set(it.favorite, favorite)
            set(it.tagme, tagme)
            set(it.relations, relations)
            set(it.exportedDescription, exportedDescription)
            set(it.exportedScore, exportedScore)
            set(it.partitionTime, partitionTime)
            set(it.orderTime, orderTime)
            set(it.createTime, createTime)
            set(it.updateTime, createTime)
        } as Int

        if(score != null && collection != null && collection.score == null) {
            //指定image的score、存在parent且未指定parent的score时，为parent重新计算exported score
            val newExportedScore = data.db.from(Illusts)
                .select(sum(Illusts.score).aliased("score"), count(Illusts.id).aliased("count"))
                .where { (Illusts.parentId eq collection.id) and Illusts.score.isNotNull() }
                .first().let {
                    val sum = it.getInt("score")
                    val count = it.getInt("count")
                    (sum + score) * 1.0 / (count + 1)
                }
            data.db.update(Illusts) {
                where { it.id eq collection.id }
                set(it.exportedScore, newExportedScore)
            }
        }

        if(tags != null || authors != null || topics != null) {
            processAllTags(id, creating = true, newTags = tags, newTopics = topics, newAuthors = authors)
        }

        return id
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出。
     */
    private fun processAllTags(thisId: Int, creating: Boolean = false, newTags: List<Int>? = null, newTopics: List<Int>? = null, newAuthors: List<Int>? = null) {
        val tagAnnotations = if(newTags == null) null else
            processTags(thisId, creating, tagRelations = IllustTagRelations, tagAnnotationRelations = TagAnnotationRelations, newTagIds = tagMgr.exportTag(newTags))
        val topicAnnotations = if(newTopics == null) null else
            processTags(thisId, creating, tagRelations = IllustTopicRelations, tagAnnotationRelations = TopicAnnotationRelations, newTagIds = topicMgr.exportTopic(newTopics))
        val authorAnnotations = if(newAuthors == null) null else
            processTags(thisId, creating, tagRelations = IllustAuthorRelations, tagAnnotationRelations = AuthorAnnotationRelations, newTagIds = authorMgr.exportAuthor(newAuthors))
        if(tagAnnotations != null || topicAnnotations != null || authorAnnotations != null) {
            val oldAnnotations = data.db.from(IllustAnnotationRelations).select()
                .where { IllustAnnotationRelations.illustId eq thisId }
                .asSequence()
                .map { Pair(it[IllustAnnotationRelations.illustId]!!, it[IllustAnnotationRelations.exportedFrom]!!) }
                .toMap()

            val adds = mutableMapOf<Int, Annotation.ExportedFrom>()
            tagAnnotations?.filter { it !in oldAnnotations }?.forEach {
                if(it !in adds) adds[it] = Annotation.ExportedFrom.TAG
                else adds[it] = adds[it]!!.plus(Annotation.ExportedFrom.TAG)
            }
            topicAnnotations?.filter { it !in oldAnnotations }?.forEach {
                if(it !in adds) adds[it] = Annotation.ExportedFrom.TOPIC
                else adds[it] = adds[it]!!.plus(Annotation.ExportedFrom.TOPIC)
            }
            authorAnnotations?.filter { it !in oldAnnotations }?.forEach {
                if(it !in adds) adds[it] = Annotation.ExportedFrom.AUTHOR
                else adds[it] = adds[it]!!.plus(Annotation.ExportedFrom.AUTHOR)
            }
            //TODO 完成annotation导出到illust的过程。写起来十分麻烦。
        }
    }

    /**
     * 检验某种类型的tag，并返回它导出的annotations。
     */
    private fun <R, RA> processTags(thisId: Int, creating: Boolean = false, newTagIds: List<Pair<Int, Boolean>>,
                                    tagRelations: R, tagAnnotationRelations: RA): List<Int>
    where R: EntityTargetRelationTable<*>, RA: TargetAnnotationRelationTable<*> {
        val tagIds = newTagIds.toMap()
        val oldTagIds = if(creating) emptyMap() else {
            data.db.from(tagRelations).select(tagRelations.targetId(), tagRelations.exported())
                .where { tagRelations.entityId() eq thisId }
                .asSequence()
                .map { Pair(it[tagRelations.entityId()]!!, it[tagRelations.exported()]!!) }
                .toMap()
        }
        val deleteIds = oldTagIds.keys - tagIds.keys
        if(deleteIds.isNotEmpty()) {
            data.db.delete(tagRelations) { (tagRelations.entityId() eq thisId) and (tagRelations.targetId() inList deleteIds) }
        }

        val addIds = tagIds - oldTagIds.keys
        if(addIds.isNotEmpty()) {
            data.db.batchInsert(tagRelations) {
                for ((addId, isExported) in addIds) {
                    item {
                        set(tagRelations.entityId(), thisId)
                        set(tagRelations.targetId(), addId)
                        set(tagRelations.exported(), isExported)
                    }
                }
            }
        }

        val changeIds = (tagIds.keys intersect oldTagIds.keys).flatMap { id ->
            val newExported = tagIds[id]
            val oldExported = oldTagIds[id]
            if(newExported != oldExported) sequenceOf(Pair(id, newExported!!)) else emptySequence()
        }
        if(changeIds.isNotEmpty()) {
            data.db.batchUpdate(tagRelations) {
                for ((changeId, isExported) in changeIds) {
                    item {
                        where { (tagRelations.entityId() eq thisId) and (tagRelations.targetId() eq changeId) }
                        set(tagRelations.exported(), isExported)
                    }
                }
            }
        }

        return if(tagIds.isEmpty()) emptyList() else {
            data.db.from(tagAnnotationRelations)
                .innerJoin(Annotations, (tagAnnotationRelations.annotationId() eq Annotations.id) and Annotations.canBeExported)
                .select(Annotations.id)
                .where { tagAnnotationRelations.targetId() inList tagIds.keys }
                .map { it[Annotations.id]!! }
        }
    }

    /**
     * 校验relations。
     */
    private fun checkRelations(relations: List<Int>) {
        val relationResult = data.db.from(Illusts).select(Illusts.id).where { Illusts.id inList relations }.map { it[Illusts.id]!! }
        if(relationResult.size < relations.size) {
            throw ResourceNotExist("relations", relations.toSet() - relationResult.toSet())
        }
    }
}