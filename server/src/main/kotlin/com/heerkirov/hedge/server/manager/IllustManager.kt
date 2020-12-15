package com.heerkirov.hedge.server.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.IllustTagRelations
import com.heerkirov.hedge.server.dao.Illusts
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
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
        if(newTags != null) processTags(thisId, newTags, creating)
        TODO()
    }

    private fun processTags(thisId: Int, newTags: List<Int>, creating: Boolean = false) {
        //TODO 使用inline模版代码处理多个类别
        val tagIds = tagMgr.exportTag(newTags).toMap()
        val oldTagIds = if(creating) emptyMap() else {
            data.db.from(IllustTagRelations).select(IllustTagRelations.tagId, IllustTagRelations.isExported)
                .where { IllustTagRelations.illustId eq thisId }
                .asSequence()
                .map { Pair(it[IllustTagRelations.tagId]!!, it[IllustTagRelations.isExported]!!) }
                .toMap()
        }
        val deleteIds = oldTagIds.keys - tagIds.keys
        if(deleteIds.isNotEmpty()) {
            data.db.delete(IllustTagRelations) { (it.illustId eq thisId) and (it.tagId inList deleteIds) }
        }

        val addIds = tagIds - oldTagIds.keys
        if(addIds.isNotEmpty()) {
            data.db.batchInsert(IllustTagRelations) {
                for ((addId, isExported) in addIds) {
                    item {
                        set(it.illustId, thisId)
                        set(it.tagId, addId)
                        set(it.isExported, isExported)
                    }
                }
            }
        }

        val changeIds = (tagIds.keys intersect oldTagIds.keys).flatMap { id ->
            val newExported = tagIds[id]
            val oldExported = oldTagIds[id]
            if(newExported != oldExported) {
                sequenceOf(Pair(id, newExported!!))
            }else{
                emptySequence()
            }
        }
        if(changeIds.isNotEmpty()) {
            data.db.batchUpdate(IllustTagRelations) {
                for ((changeId, isExported) in changeIds) {
                    item {
                        where { (it.illustId eq thisId) and (it.tagId eq changeId) }
                        set(it.isExported, isExported)
                    }
                }
            }
        }
    }

    private fun checkRelations(relations: List<Int>) {
        val relationResult = data.db.from(Illusts).select(Illusts.id).where { Illusts.id inList relations }.map { it[Illusts.id]!! }
        if(relationResult.size < relations.size) {
            throw ResourceNotExist("relations", relations.toSet() - relationResult.toSet())
        }
    }
}