package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.backend.CollectionExporterTask
import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.backend.ImageExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.undefined
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*
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
            set(it.cachedChildrenCount, 0)
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

        }else if (collection != null && kit.anyNotExportedMeta(collection.id)) {
            //tag为空且parent的tag不为空时，直接应用parent的exported tag(因为一定是从parent的tag导出的，不需要再算一次)
            kit.copyAllMetaFromParent(id, collection.id)
        }

        if(collection != null) {
            //对parent做重导出。尽管重导出有多个可分离的部分，但分开判定太费劲且收益不高，就统一只要有parent就重导出了
            illustMetaExporter.appendNewTask(CollectionExporterTask(collection.id, exportFileAndTime = true, exportMeta = true))
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
            set(it.cachedChildrenCount, images.size)
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

        processSubImages(images, id, formDescription, formScore)

        return id
    }

    /**
     * 应用images列表，设置images的parent为当前collection。
     * 如果image已有其他parent，覆盖那些parent，并对那些parent做属性重导出(主要是fileId)。由于collection要求至少有1个子项，没有子项的collection会被删除。
     * image的exported属性如果没有填写，会被重新导出计算。
     */
    fun processSubImages(images: List<Illust>, thisId: Int, thisDescription: String, thisScore: Int?) {
        val imageIds = images.map { it.id }
        //处理那些新列表中没有，也就是需要被移除的项
        val deleteIds = data.db.from(Illusts).select(Illusts.id).where { (Illusts.id notInList imageIds) and (Illusts.parentId eq thisId) }.map { it[Illusts.id]!! }
        data.db.update(Illusts) {
            where { it.id inList deleteIds }
            set(it.type, Illust.Type.IMAGE)
            set(it.parentId, null)
        }
        //修改子项的parentId/type。如果存在description/score，那么也有可能导出给子项
        data.db.update(Illusts) {
            where { it.id inList imageIds }
            set(it.parentId, thisId)
            set(it.type, Illust.Type.IMAGE_WITH_PARENT)
        }
        if(thisDescription.isNotEmpty()) {
            data.db.update(Illusts) {
                where { (it.id inList imageIds) and (it.description eq "") }
                set(it.exportedDescription, thisDescription)
            }
        }
        if(thisScore != null) {
            data.db.update(Illusts) {
                where { (it.id inList imageIds) and (it.score.isNull()) }
                set(it.exportedScore, thisScore)
            }
        }
        val now = DateTime.now()
        for (image in images) {
            if(image.parentId != null && image.parentId != thisId) {
                //此image有旧的parent，需要对旧parent做重新导出
                processRemoveItemFromCollection(image.parentId, image, now)
            }
        }
        //将被从列表移除的images加入重导出任务
        illustMetaExporter.appendNewTask(deleteIds.map { ImageExporterTask(it, exportDescription = true, exportScore = true, exportMeta = true) })
    }

    /**
     * 向collection中添加了一个新子项(由于移动子项)，对此collection做快速重导出，如有必要，放入metaExporter。
     */
    fun processAddItemToCollection(collectionId: Int, addedImage: Illust, currentTime: LocalDateTime? = null) {
        val firstImage = data.db.sequenceOf(Illusts).filter { (it.parentId eq collectionId) and (it.id notEq addedImage.id) }.sortedBy { it.orderTime }.firstOrNull()

        data.db.update(Illusts) {
            where { it.id eq collectionId }
            if(firstImage == null || firstImage.orderTime >= addedImage.orderTime) {
                //只有当现有列表的第一项的排序顺位>=被放入的项时，才发起更新。
                //如果顺位<当前项，那么旧parent的封面肯定是这个第一项而不是当前项，就不需要更新。
                set(it.fileId, addedImage.fileId)
                set(it.partitionTime, addedImage.partitionTime)
                set(it.orderTime, addedImage.orderTime)
            }
            set(it.cachedChildrenCount, it.cachedChildrenCount plus 1)
            set(it.updateTime, currentTime ?: DateTime.now())
        }
    }

    /**
     * 从collection中移除了一个子项(由于删除子项或移动子项)，对此collection做快速重导出，如有必要，放入metaExporter。
     */
    fun processRemoveItemFromCollection(collectionId: Int, removedImage: Illust, currentTime: LocalDateTime? = null) {
        //关键属性(fileId, partitionTime, orderTime)的重导出不延后到metaExporter，在事务内立即完成
        val parent = data.db.sequenceOf(Illusts).first { it.id eq collectionId }
        val firstImage = data.db.sequenceOf(Illusts).filter { (it.parentId eq collectionId) and (it.id notEq removedImage.id) }.sortedBy { it.orderTime }.firstOrNull()
        if(firstImage != null) {
            data.db.update(Illusts) {
                where { it.id eq collectionId }
                if(firstImage.orderTime >= removedImage.orderTime) {
                    //只有当剩余列表的第一项的排序顺位>=被取出的当前项时，才发起更新。
                    //这个项肯定不是当前项，如果顺位<当前项，那么旧parent的封面肯定是这个第一项而不是当前项，就不需要更新。
                    set(it.fileId, firstImage.fileId)
                    set(it.partitionTime, firstImage.partitionTime)
                    set(it.orderTime, firstImage.orderTime)
                }
                set(it.cachedChildrenCount, it.cachedChildrenCount minus 1)
                set(it.updateTime, currentTime ?: DateTime.now())
            }
            //其他属性稍后在metaExporter延后导出
            illustMetaExporter.appendNewTask(CollectionExporterTask(parent.id, exportScore = true, exportMeta = true))
        }else{
            //此collection已经没有项了，将其删除
            data.db.delete(Illusts) { it.id eq parent.id }
            data.db.delete(IllustTagRelations) { it.illustId eq parent.id }
            data.db.delete(IllustAuthorRelations) { it.illustId eq parent.id }
            data.db.delete(IllustTopicRelations) { it.illustId eq parent.id }
            data.db.delete(IllustAnnotationRelations) { it.illustId eq parent.id }

            if(!parent.exportedRelations.isNullOrEmpty()) relationManager.removeItemInRelations(parent.id, parent.exportedRelations)
        }
    }
}