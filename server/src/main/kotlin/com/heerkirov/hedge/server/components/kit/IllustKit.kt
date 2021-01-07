package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.backend.MetaExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.components.manager.RelationManager
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.AuthorAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.TagAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.TopicAnnotationRelations
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.union
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.dsl.where
import me.liuwj.ktorm.entity.*
import java.time.LocalDate
import java.time.LocalDateTime
import kotlin.math.roundToInt

class IllustKit(private val data: DataRepository,
                private val metaManager: MetaManager,
                private val relationManager: RelationManager,
                private val illustMetaExporter: IllustMetaExporter) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(score <= 0 || score > data.metadata.meta.scoreMaximum) throw ParamError("score")
    }

    /**
     * 使用目标的所有relations，拷贝一份赋给当前项，统一设定为exported。
     */
    fun copyAllMeta(thisId: Int, fromId: Int) {
        fun <R> copyOneMeta(tagRelations: R) where R: EntityMetaRelationTable<*> {
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
        fun copyAnnotation() {
            val items = data.db.from(IllustAnnotationRelations)
                .select(IllustAnnotationRelations.annotationId, IllustAnnotationRelations.exportedFrom)
                .where { IllustAnnotationRelations.illustId eq fromId }
                .map { Pair(it[IllustAnnotationRelations.annotationId]!!, it[IllustAnnotationRelations.exportedFrom]!!) }
            data.db.batchInsert(IllustAnnotationRelations) {
                for ((id, exportedFrom) in items) {
                    item {
                        set(IllustAnnotationRelations.illustId, thisId)
                        set(IllustAnnotationRelations.annotationId, id)
                        set(IllustAnnotationRelations.exportedFrom, exportedFrom)
                    }
                }
            }
        }

        copyOneMeta(IllustTagRelations)
        copyOneMeta(IllustAuthorRelations)
        copyOneMeta(IllustTopicRelations)
        copyAnnotation()
    }

    /**
     * 从当前项的所有子项拷贝全部的meta，统一设定为exported。
     */
    fun copyAllMetaFromChildren(thisId: Int) {
        fun <R> copyOneMeta(tagRelations: R) where R: EntityMetaRelationTable<*> {
            val ids = data.db.from(Illusts)
                .innerJoin(tagRelations, tagRelations.entityId() eq Illusts.id)
                .select(tagRelations.metaId())
                .where { Illusts.parentId eq thisId }
                .asSequence()
                .map { it[tagRelations.metaId()]!! }
                .toSet()
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
        fun copyAnnotation() {
            val items = data.db.from(Illusts)
                .innerJoin(IllustAnnotationRelations, IllustAnnotationRelations.illustId eq Illusts.id)
                .select(IllustAnnotationRelations.annotationId, IllustAnnotationRelations.exportedFrom)
                .where { Illusts.parentId eq thisId }
                .map { Pair(it[IllustAnnotationRelations.annotationId]!!, it[IllustAnnotationRelations.exportedFrom]!!) }
                .groupBy({ it.first }) { it.second }
                .map { (id, exportedFrom) -> Pair(id, exportedFrom.union()) }
                .toMap()
            data.db.batchInsert(IllustAnnotationRelations) {
                for ((id, exportedFrom) in items) {
                    item {
                        set(IllustAnnotationRelations.illustId, thisId)
                        set(IllustAnnotationRelations.annotationId, id)
                        set(IllustAnnotationRelations.exportedFrom, exportedFrom)
                    }
                }
            }
        }

        copyOneMeta(IllustTagRelations)
        copyOneMeta(IllustAuthorRelations)
        copyOneMeta(IllustTopicRelations)
        copyAnnotation()
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出。
     * @return 返回是否存在任何not exported tag。
     */
    fun processAllMeta(thisId: Int, creating: Boolean = false, newTags: Opt<List<Int>>, newTopics: Opt<List<Int>>, newAuthors: Opt<List<Int>>): Boolean {
        val tagAnnotations = if(newTags.isPresent) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.exportTag(newTags.value))
        val topicAnnotations = if(newTopics.isPresent) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.exportTopic(newTopics.value))
        val authorAnnotations = if(newAuthors.isPresent) null else
            processOneMeta(thisId, creating,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.exportAuthor(newAuthors.value))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)

        return if(creating) {
            (newTags.isPresent && newTags.value.isNotEmpty()) || (newAuthors.isPresent && newAuthors.value.isNotEmpty()) || (newTopics.isPresent && newTopics.value.isNotEmpty())
        }else{
            //对于每一个列表，给出新值时，直接判断新列表是否为空；没有给出新值则需要查旧值是否有任意存在。
            newTags.runOpt { isNotEmpty() }.unwrapOr { anyNotExportedMeta(thisId, IllustTagRelations) }
                    || newAuthors.runOpt { isNotEmpty() }.unwrapOr { anyNotExportedMeta(thisId, IllustAuthorRelations) }
                    || newTopics.runOpt { isNotEmpty() }.unwrapOr { anyNotExportedMeta(thisId, IllustTopicRelations) }
        }
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
     * 当目标对象存在任意一个not exported的meta tag时，返回true。
     */
    fun anyNotExportedMeta(id: Int): Boolean {
        return anyNotExportedMeta(id, IllustTagRelations) || anyNotExportedMeta(id, IllustAuthorRelations) || anyNotExportedMeta(id, IllustTopicRelations)
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
     * 校验collection的images列表的正确性。
     * 要求必须存在至少一项，检查是否有不存在或不合法的项。
     * @return 导出那些exported属性(fileId, score, partitionTime, orderTime)
     */
    fun validateSubImages(imageIds: List<Int>): Tuple5<List<Illust>, Int, Int?, LocalDate, Long> {
        if(imageIds.isEmpty()) throw ParamRequired("images")
        val images = data.db.sequenceOf(Illusts).filter { (it.id inList imageIds) and (it.type notEq Illust.Type.COLLECTION) }.toList()
        //数量不够表示有imageId不存在(或类型是collection，被一同判定为不存在)
        if(images.size < imageIds.size) throw ResourceNotExist("images", imageIds.toSet() - images.asSequence().map { it.id }.toSet())

        val firstImage = images.minByOrNull { it.orderTime }!!
        val fileId = firstImage.fileId
        val partitionTime = firstImage.partitionTime
        val orderTime = firstImage.orderTime
        val score = images.asSequence().mapNotNull { it.score }.average().run { if(isNaN()) null else this }?.roundToInt()

        return Tuple5(images, fileId, score, partitionTime, orderTime)
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
        illustMetaExporter.appendNewTask(deleteIds.map { MetaExporterTask(MetaExporterTask.Type.ILLUST, it) })
    }

    /**
     * 向collection中添加了一个新子项(由于移动子项)，对此collection做快速重导出，如有必要，放入metaExporter。
     */
    fun processAddItemToCollection(collectionId: Int, addedImage: Illust, currentTime: LocalDateTime? = null) {
        val firstImage = data.db.sequenceOf(Illusts).filter { (it.parentId eq collectionId) and (it.id notEq addedImage.id) }.sortedBy { it.orderTime }.firstOrNull()
        if(firstImage != null) {
            if(firstImage.orderTime >= addedImage.orderTime) {
                //只有当现有列表的第一项的排序顺位>=被放入的项时，才发起更新。
                //如果顺位<当前项，那么旧parent的封面肯定是这个第一项而不是当前项，就不需要更新。
                data.db.update(Illusts) {
                    where { it.id eq collectionId }
                    set(it.fileId, addedImage.fileId)
                    set(it.partitionTime, addedImage.partitionTime)
                    set(it.orderTime, addedImage.orderTime)
                    set(it.updateTime, currentTime ?: DateTime.now())
                }
            }
        }else{
            throw RuntimeException("There is no images in collection $collectionId.")
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
            if(firstImage.orderTime >= removedImage.orderTime) {
                //只有当剩余列表的第一项的排序顺位>=被取出的当前项时，才发起更新。
                //这个项肯定不是当前项，如果顺位<当前项，那么旧parent的封面肯定是这个第一项而不是当前项，就不需要更新。
                data.db.update(Illusts) {
                    where { it.id eq collectionId }
                    set(it.fileId, firstImage.fileId)
                    set(it.partitionTime, firstImage.partitionTime)
                    set(it.orderTime, firstImage.orderTime)
                    set(it.updateTime, currentTime ?: DateTime.now())
                }
            }
            //其他属性稍后在metaExporter延后导出
            illustMetaExporter.appendNewTask(MetaExporterTask.Type.ILLUST, parent.id)
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