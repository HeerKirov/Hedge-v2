package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.backend.MetaExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.dao.illust.IllustAuthorRelations
import com.heerkirov.hedge.server.dao.illust.IllustTagRelations
import com.heerkirov.hedge.server.dao.illust.IllustTopicRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.undefined
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import java.time.LocalDate
import java.time.LocalDateTime

class IllustManager(private val data: DataRepository,
                    private val kit: IllustKit,
                    private val relationManager: RelationManager,
                    private val sourceManager: SourceManager,
                    private val partitionManager: PartitionManager,
                    private val illustMetaExporter: IllustMetaExporter) {
    /**
     * 创建新的image。
     */
    fun newImage(fileId: Int, parentId: Int? = null, relations: List<Int>? = null,
                 source: String? = null, sourceId: Long? = null, sourcePart: Int? = null,
                 description: String = "", score: Int? = null, favorite: Boolean = false, tagme: Illust.Tagme = Illust.Tagme.EMPTY,
                 tags: List<Int>? = null, topics: List<Int>? = null, authors: List<Int>? = null,
                 partitionTime: LocalDate, orderTime: Long, createTime: LocalDateTime): Int {
        val collection = if(parentId == null) null else {
            data.db.sequenceOf(Illusts)
                .firstOrNull { (Illusts.type eq Illust.Type.COLLECTION) and (Illusts.id eq parentId) }
                ?: throw ResourceNotExist("parentId", parentId)
        }

        partitionManager.addItemInPartition(partitionTime)

        if(relations != null) relationManager.validateRelations(relations)

        val (newSource, newSourceId, newSourcePart) = sourceManager.validateAndCreateSourceImageIfNotExist(source, sourceId, sourcePart)

        val exportedDescription = if(description.isEmpty() && collection != null) collection.exportedDescription else description
        val exportedScore = if(score == null && collection != null) collection.exportedScore else score

        val id = data.db.insertAndGenerateKey(Illusts) {
            set(it.type, if(collection != null) Illust.Type.IMAGE_WITH_PARENT else Illust.Type.IMAGE)
            set(it.parentId, parentId)
            set(it.fileId, fileId)
            set(it.source, newSource)
            set(it.sourceId, newSourceId)
            set(it.sourcePart, newSourcePart)
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

        if(relations != null) relationManager.processExportedRelations(id, relations)

        if(!tags.isNullOrEmpty() || !authors.isNullOrEmpty() || !topics.isNullOrEmpty()) {
            //指定了任意tags时，对tag进行校验和分析，导出，并同时导出annotations
            kit.processAllMeta(id, creating = true,
                newTags = tags?.let { Opt(it) } ?: undefined(),
                newTopics = topics?.let { Opt(it) } ?: undefined(),
                newAuthors = authors?.let { Opt(it) } ?: undefined())

            if(collection != null && !kit.anyNotExportedMeta(collection.id)) {
                illustMetaExporter.appendNewTask(MetaExporterTask.Type.ILLUST, collection.id)
            }
        }else if (collection != null && kit.anyNotExportedMeta(collection.id)) {
            //tag为空且parent的tag不为空时，直接应用parent的exported tag(因为一定是从parent的tag导出的，不需要再算一次)
            kit.copyAllMeta(id, collection.id)
        }

        return id
    }

    /**
     * 创建新的collection。
     */
    fun newCollection(formImages: List<Int>, formDescription: String, formScore: Int?, formFavorite: Boolean, formTagme: Illust.Tagme): Int {
        val createTime = DateTime.now()

        val (images, fileId, scoreFromSub, partitionTime, orderTime) = kit.validateSubImages(formImages)

        val id = data.db.insertAndGenerateKey(Illusts) {
            set(it.type, Illust.Type.COLLECTION)
            set(it.parentId, null)
            set(it.fileId, fileId)
            set(it.source, null)
            set(it.sourceId, null)
            set(it.sourcePart, null)
            set(it.description, formDescription)
            set(it.score, formScore)
            set(it.favorite, formFavorite)
            set(it.tagme, formTagme)
            set(it.relations, null)
            set(it.exportedDescription, formDescription)
            set(it.exportedScore, formScore ?: scoreFromSub)
            set(it.partitionTime, partitionTime)
            set(it.orderTime, orderTime)
            set(it.createTime, createTime)
            set(it.updateTime, createTime)
        } as Int

        kit.processSubImages(images, id, formDescription, formScore)

        return id
    }
}