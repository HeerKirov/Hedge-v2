package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.union
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.dsl.where
import me.liuwj.ktorm.entity.*
import java.time.LocalDate
import kotlin.math.roundToInt

class IllustKit(private val data: DataRepository,
                private val metaManager: MetaManager) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(score <= 0 || score > data.metadata.meta.scoreMaximum) throw ParamError("score")
    }

    /**
     * 使用目标的所有relations，拷贝一份赋给当前项，统一设定为exported。
     */
    fun copyAllMetaToImage(thisId: Int, fromId: Int) {
        fun <R : EntityMetaRelationTable<*>, T : MetaTag<*>> copyOneMeta(tagRelations: R, metaTag: T) {
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
            //修改统计计数
            data.db.update(metaTag) {
                where { it.metaId() inList ids }
                set(it.cachedCount(), it.cachedCount() plus 1)
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

        copyOneMeta(IllustTagRelations, Tags)
        copyOneMeta(IllustAuthorRelations, Authors)
        copyOneMeta(IllustTopicRelations, Topics)
        copyAnnotation()
    }

    /**
     * 删除image此关系关联的全部tag。
     */
    private fun <R : EntityMetaRelationTable<*>, T : MetaTag<*>> deleteAllMeta(id: Int, metaRelations: R, metaTag: T, analyseStatisticCount: Boolean) {
        if(analyseStatisticCount) {
            val ids = data.db.from(metaRelations).select(metaRelations.metaId()).where { metaRelations.entityId() eq id }.map { it[metaRelations.metaId()]!! }
            data.db.delete(metaRelations) {
                it.entityId() eq id
            }
            //修改统计计数
            data.db.update(metaTag) {
                where { it.metaId() inList ids }
                set(it.cachedCount(), it.cachedCount() minus 1)
            }
        }else{
            data.db.delete(metaRelations) {
                it.entityId() eq id
            }
        }
    }

    /**
     * 从当前项的所有子项拷贝全部的meta，统一设定为exported。
     */
    private fun copyAllMetaFromChildrenToCollection(thisId: Int) {
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
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出处理。
     * @param copyFromParent 当当前对象没有任何meta tag关联时，从parent复制tag，并提供parent的id
     * @param copyFromChildren 当当前对象没有任何meta tag关联时，从children复制tag
     */
    fun processAllMeta(thisId: Int, newTags: Opt<List<Int>>, newTopics: Opt<List<Int>>, newAuthors: Opt<List<Int>>,
                       creating: Boolean = false, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        val tagAnnotations = if(newTags.isUndefined) null else
            processOneMeta(thisId, creating, analyseStatisticCount,
                metaTag = Tags,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.validateAndExportTag(newTags.value))
        val topicAnnotations = if(newTopics.isUndefined) null else
            processOneMeta(thisId, creating, analyseStatisticCount,
                metaTag = Topics,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.validateAndExportTopic(newTopics.value))
        val authorAnnotations = if(newAuthors.isUndefined) null else
            processOneMeta(thisId, creating, analyseStatisticCount,
                metaTag = Authors,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.validateAuthor(newAuthors.value))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)

        val tagCount = if(newTags.isPresent) newTags.value.size else if(creating) 0 else getNotExportedMetaCount(thisId, IllustTagRelations)
        val topicCount = if(newTopics.isPresent) newTopics.value.size else if(creating) 0 else getNotExportedMetaCount(thisId, IllustTopicRelations)
        val authorCount = if(newAuthors.isPresent) newAuthors.value.size else if(creating) 0 else getNotExportedMetaCount(thisId, IllustAuthorRelations)

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag
            if(copyFromParent != null) {
                if(anyNotExportedMeta(copyFromParent)) copyAllMetaToImage(thisId, copyFromParent)
            }else if (copyFromChildren) {
                copyAllMetaFromChildrenToCollection(thisId)
            }
        }else if(((newTags.isPresent && tagCount > 0) || (newAuthors.isPresent && authorCount > 0) || (newTopics.isPresent && topicCount > 0))
                && (newAuthors.isPresent || authorCount == 0)
                && (newTopics.isPresent || authorCount == 0)
                && (newTags.isPresent || tagCount == 0)) {
            //若发现未修改列表数量都为0，已修改至少一项不为0，那么清空未修改列表从依赖项那里获得的exported tag
            //在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
            if(newTags.isUndefined) deleteAllMeta(thisId, IllustTagRelations, Tags, analyseStatisticCount)
            if(newAuthors.isUndefined) deleteAllMeta(thisId, IllustAuthorRelations, Authors, analyseStatisticCount)
            if(newTopics.isUndefined) deleteAllMeta(thisId, IllustTopicRelations, Topics, analyseStatisticCount)
        }
    }

    /**
     * 在没有更新的情况下，强制重新导出meta tag。被使用在meta exporter的后台任务中。
     */
    fun forceProcessAllMeta(thisId: Int, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        val tagAnnotations = processOneMeta(thisId, creating = false, analyseStatisticCount,
                metaTag = Tags,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.exportTag(TODO(), conflictingMembersCheck = false))
        val topicAnnotations = processOneMeta(thisId, creating = false, analyseStatisticCount,
                metaTag = Topics,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.validateAndExportTopic(TODO()))
        val authorAnnotations = processOneMeta(thisId, creating = false, analyseStatisticCount,
                metaTag = Authors,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.validateAuthor(TODO()))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)

        val tagCount = getNotExportedMetaCount(thisId, IllustTagRelations)
        val topicCount = getNotExportedMetaCount(thisId, IllustTopicRelations)
        val authorCount = getNotExportedMetaCount(thisId, IllustAuthorRelations)

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag
            if(copyFromParent != null) {
                if(anyNotExportedMeta(copyFromParent)) copyAllMetaToImage(thisId, copyFromParent)
            }else if (copyFromChildren) {
                copyAllMetaFromChildrenToCollection(thisId)
            }
        }
//        else if(((newTags.isPresent && tagCount > 0) || (newAuthors.isPresent && authorCount > 0) || (newTopics.isPresent && topicCount > 0))
//            && (newAuthors.isUndefined && authorCount == 0 || newAuthors.isPresent)
//            && (newTopics.isUndefined && authorCount == 0 || newTopics.isPresent)
//            && (newTags.isUndefined && tagCount == 0 || newTags.isPresent)) {
//            //若发现未修改列表数量都为0，已修改至少一项不为0，那么清空未修改列表从依赖项那里获得的exported tag
//            //在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
//            if(newTags.isUndefined) deleteAllMeta(thisId, IllustTagRelations, Tags, analyseStatisticCount)
//            if(newAuthors.isUndefined) deleteAllMeta(thisId, IllustAuthorRelations, Authors, analyseStatisticCount)
//            if(newTopics.isUndefined) deleteAllMeta(thisId, IllustTopicRelations, Topics, analyseStatisticCount)
//        }
    }

    /**
     * 检验并处理某种类型的tag，并返回它导出的annotations。
     */
    private fun <T, R, RA> processOneMeta(thisId: Int, creating: Boolean = false, analyseStatisticCount: Boolean, newTagIds: List<Pair<Int, Boolean>>,
                                          metaTag: T, metaRelations: R, metaAnnotationRelations: RA): Set<Int>
    where T: MetaTag<*>, R: EntityMetaRelationTable<*>, RA: MetaAnnotationRelationTable<*> {
        val tagIds = newTagIds.toMap()
        val oldTagIds = if(creating) emptyMap() else {
            data.db.from(metaRelations).select(metaRelations.metaId(), metaRelations.exported())
                .where { metaRelations.entityId() eq thisId }
                .asSequence()
                .map { Pair(it[metaRelations.metaId()]!!, it[metaRelations.exported()]!!) }
                .toMap()
        }
        val deleteIds = oldTagIds.keys - tagIds.keys
        if(deleteIds.isNotEmpty()) {
            data.db.delete(metaRelations) { (metaRelations.entityId() eq thisId) and (metaRelations.metaId() inList deleteIds) }
        }
        if(analyseStatisticCount) {
            data.db.update(metaTag) {
                where { it.metaId() inList deleteIds }
                set(it.cachedCount(), it.cachedCount() minus 1)
            }
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
        if(analyseStatisticCount) {
            data.db.update(metaTag) {
                where { it.metaId() inList addIds.keys }
                set(it.cachedCount(), it.cachedCount() plus 1)
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
                .map { Pair(it[IllustAnnotationRelations.annotationId]!!, it[IllustAnnotationRelations.exportedFrom]!!) }
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
        return getNotExportedMetaCount(id, IllustTagRelations) > 0 || getNotExportedMetaCount(id, IllustAuthorRelations) > 0 || getNotExportedMetaCount(id, IllustTopicRelations) > 0
    }

    /**
     * 工具函数：使用目标关系，判断此关系直接关联(not exported)的对象是否存在。存在任意一个即返回true。
     */
    private fun <R> getNotExportedMetaCount(id: Int, metaRelations: R): Int where R: EntityMetaRelationTable<*> {
        return data.db.from(metaRelations).select(count().aliased("count"))
            .where { (metaRelations.entityId() eq id) and (metaRelations.exported().not()) }
            .firstOrNull()?.getInt("count") ?: 0
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
}