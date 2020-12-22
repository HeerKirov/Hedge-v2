package com.heerkirov.hedge.server.components.service.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
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
            val newParentExportedScore = data.db.from(Illusts)
                .select(sum(Illusts.score).aliased("score"), count(Illusts.id).aliased("count"))
                .where { (Illusts.parentId eq collection.id) and Illusts.score.isNotNull() }
                .first().let {
                    val sum = it.getInt("score")
                    val count = it.getInt("count")
                    (sum + score) * 1.0 / (count + 1)
                }
            data.db.update(Illusts) {
                where { it.id eq collection.id }
                set(it.exportedScore, newParentExportedScore)
            }
        }

        if(tags != null || authors != null || topics != null) {
            //指定了任意tags时，对tag进行校验和分析，导出，并同时导出annotations
            processAllMeta(id, creating = true, newTags = tags, newTopics = topics, newAuthors = authors)

            if(collection != null && !anyNotExportedMeta(collection.id, IllustTagRelations)
                && !anyNotExportedMeta(collection.id, IllustAuthorRelations)
                && !anyNotExportedMeta(collection.id, IllustTopicRelations)) {
                //TODO tag存在且parent的tag不存在时，为parent重新导出exported tag，放入导出队列
            }
        }else if (collection != null && anyNotExportedMeta(collection.id, IllustTagRelations)
            && anyNotExportedMeta(collection.id, IllustAuthorRelations)
            && anyNotExportedMeta(collection.id, IllustTopicRelations)) {
            //tag为空且parent的tag不为空时，直接应用parent的exported tag(因为一定是从parent的tag导出的，不需要再算一次)
            copyAllMeta(id, collection.id)
        }

        return id
    }

    /**
     * 使用目标的所有relations，拷贝一份赋给当前项，统一设定为exported。
     */
    private fun copyAllMeta(thisId: Int, fromId: Int) {
        fun <R> copyOneMeta(thisId: Int, fromId: Int, tagRelations: R) where R: EntityMetaRelationTable<*> {
            val ids = data.db.from(tagRelations).select(tagRelations.metaId()).where { tagRelations.entityId() eq fromId }.map { it[tagRelations.metaId()]!! }
            data.db.batchInsert(tagRelations) {
                for (tagId in ids) {
                    item {
                        set(tagRelations.entityId(), thisId)
                        set(tagRelations.metaId(), tagId)
                        set(tagRelations.exported(), true)
                    }
                }
            }
        }

        copyOneMeta(thisId, fromId, IllustTagRelations)
        copyOneMeta(thisId, fromId, IllustAuthorRelations)
        copyOneMeta(thisId, fromId, IllustTopicRelations)
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出。
     */
    private fun processAllMeta(thisId: Int, creating: Boolean = false, newTags: List<Int>? = null, newTopics: List<Int>? = null, newAuthors: List<Int>? = null) {
        val tagAnnotations = if(newTags == null) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = tagMgr.exportTag(newTags))
        val topicAnnotations = if(newTopics == null) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = topicMgr.exportTopic(newTopics))
        val authorAnnotations = if(newAuthors == null) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = authorMgr.exportAuthor(newAuthors))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)
    }

    /**
     * 检验并处理某种类型的tag，并返回它导出的annotations。
     */
    private fun <R, RA> processOneMeta(thisId: Int, creating: Boolean = false, newTagIds: List<Pair<Int, Boolean>>,
                                       metaRelations: R, metaAnnotationRelations: RA): Set<Int> where R: EntityMetaRelationTable<*>, RA: MetaAnnotationRelationTable<*> {
        val tagIds = newTagIds.toMap()
        val oldTagIds = if(creating) emptyMap() else {
            data.db.from(metaRelations).select(metaRelations.metaId(), metaRelations.exported())
                .where { metaRelations.entityId() eq thisId }
                .asSequence()
                .map { Pair(it[metaRelations.entityId()]!!, it[metaRelations.exported()]!!) }
                .toMap()
        }
        val deleteIds = oldTagIds.keys - tagIds.keys
        if(deleteIds.isNotEmpty()) {
            data.db.delete(metaRelations) { (metaRelations.entityId() eq thisId) and (metaRelations.metaId() inList deleteIds) }
        }

        val addIds = tagIds - oldTagIds.keys
        if(addIds.isNotEmpty()) {
            data.db.batchInsert(metaRelations) {
                for ((addId, isExported) in addIds) {
                    item {
                        set(metaRelations.entityId(), thisId)
                        set(metaRelations.metaId(), addId)
                        set(metaRelations.exported(), isExported)
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
            data.db.batchUpdate(metaRelations) {
                for ((changeId, isExported) in changeIds) {
                    item {
                        where { (metaRelations.entityId() eq thisId) and (metaRelations.metaId() eq changeId) }
                        set(metaRelations.exported(), isExported)
                    }
                }
            }
        }

        return if(tagIds.isEmpty()) emptySet() else {
            data.db.from(metaAnnotationRelations)
                .innerJoin(Annotations, (metaAnnotationRelations.annotationId() eq Annotations.id) and Annotations.canBeExported)
                .select(Annotations.id)
                .where { metaAnnotationRelations.metaId() inList tagIds.keys }
                .asSequence()
                .map { it[Annotations.id]!! }
                .toSet()
        }
    }

    /**
     * 当关联的meta变化时，会引发间接关联的annotation的变化，处理这种变化。
     */
    private fun processAnnotationOfMeta(thisId: Int, tagAnnotations: Set<Int>?, authorAnnotations: Set<Int>?, topicAnnotations: Set<Int>?) {
        if(tagAnnotations != null || topicAnnotations != null || authorAnnotations != null) {
            val oldAnnotations = data.db.from(IllustAnnotationRelations).select()
                .where { IllustAnnotationRelations.illustId eq thisId }
                .asSequence()
                .map { Pair(it[IllustAnnotationRelations.illustId]!!, it[IllustAnnotationRelations.exportedFrom]!!) }
                .toMap()

            val adds = mutableMapOf<Int, Annotation.ExportedFrom>()
            val changes = mutableMapOf<Int, Annotation.ExportedFrom>()
            val deletes = mutableListOf<Int>()

            tagAnnotations?.filter { it !in oldAnnotations }?.forEach {
                adds[it] = if(it !in adds) Annotation.ExportedFrom.TAG
                else adds[it]!!.plus(Annotation.ExportedFrom.TAG)
            }
            topicAnnotations?.filter { it !in oldAnnotations }?.forEach {
                adds[it] = if(it !in adds) Annotation.ExportedFrom.TOPIC
                else adds[it]!!.plus(Annotation.ExportedFrom.TOPIC)
            }
            authorAnnotations?.filter { it !in oldAnnotations }?.forEach {
                adds[it] = if(it !in adds) Annotation.ExportedFrom.AUTHOR
                else adds[it]!!.plus(Annotation.ExportedFrom.AUTHOR)
            }

            for ((annotationId, oldExportedFrom) in oldAnnotations) {
                var exportedFrom = oldExportedFrom
                fun processOneCase(case: Set<Int>?, value: Annotation.ExportedFrom) {
                    if(case != null) if(annotationId in case) exportedFrom += value else exportedFrom -= value
                }
                processOneCase(tagAnnotations, Annotation.ExportedFrom.TAG)
                processOneCase(authorAnnotations, Annotation.ExportedFrom.AUTHOR)
                processOneCase(topicAnnotations, Annotation.ExportedFrom.TOPIC)
                if(exportedFrom != oldExportedFrom) {
                    if(exportedFrom.isEmpty()) {
                        //值已经被删除至empty，表示已标记为删除状态
                        deletes.add(annotationId)
                    }else{
                        //否则仅为changed
                        changes[annotationId] = exportedFrom
                    }
                }
            }

            if(adds.isNotEmpty()) data.db.batchInsert(IllustAnnotationRelations) {
                for ((addId, exportedFrom) in adds) {
                    item {
                        set(it.illustId, thisId)
                        set(it.annotationId, addId)
                        set(it.exportedFrom, exportedFrom)
                    }
                }
            }
            if(changes.isNotEmpty()) data.db.batchUpdate(IllustAnnotationRelations) {
                for ((changeId, exportedFrom) in changes) {
                    item {
                        where { (it.illustId eq thisId) and (it.annotationId eq changeId) }
                        set(it.exportedFrom, exportedFrom)
                    }
                }
            }
            if(deletes.isNotEmpty()) data.db.delete(IllustAnnotationRelations) { (it.illustId eq thisId) and (it.annotationId inList deletes) }
        }
    }

    /**
     * 工具函数：使用目标关系，判断此关系直接关联(not exported)的对象是否存在。存在任意一个即返回true。
     */
    private fun <R> anyNotExportedMeta(id: Int, metaRelations: R): Boolean where R: EntityMetaRelationTable<*> {
        return data.db.from(metaRelations).select(count().aliased("count"))
            .where { (metaRelations.entityId() eq id) and (metaRelations.exported().not()) }
            .firstOrNull()?.getInt("count")
            ?.let { it > 0 } ?: false
    }

    /**
     * 校验裙带关系relations。
     */
    private fun checkRelations(relations: List<Int>) {
        val relationResult = data.db.from(Illusts).select(Illusts.id).where { Illusts.id inList relations }.map { it[Illusts.id]!! }
        if(relationResult.size < relations.size) {
            throw ResourceNotExist("relations", relations.toSet() - relationResult.toSet())
        }
        //TODO relations需要使用拓扑结构，对关联的/旧关联的对象的relations也进行更新。
    }
}