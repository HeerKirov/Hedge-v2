package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.business.checkScore
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.filterInto
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.union
import org.ktorm.dsl.*
import org.ktorm.dsl.where
import org.ktorm.entity.*
import java.time.LocalDate
import java.util.*
import kotlin.collections.ArrayList
import kotlin.math.roundToInt

class IllustKit(private val data: DataRepository,
                private val metaManager: MetaManager) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(!checkScore(score)) throw ParamError("score")
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出处理。
     * @param copyFromParent 当当前对象没有任何meta tag关联时，从parent复制tag，并提供parent的id
     * @param copyFromChildren 当当前对象没有任何meta tag关联时，从children复制tag
     */
    fun processAllMeta(thisId: Int, newTags: Opt<List<Int>>, newTopics: Opt<List<Int>>, newAuthors: Opt<List<Int>>,
                       creating: Boolean = false, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        val tagCount = if(newTags.isPresent) newTags.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustTagRelations)
        val topicCount = if(newTopics.isPresent) newTopics.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustTopicRelations)
        val authorCount = if(newAuthors.isPresent) newAuthors.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustAuthorRelations)

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag
            if(copyFromParent != null) {
                if(anyNotExportedMeta(copyFromParent)) copyAllMetaFromParent(thisId, copyFromParent)
            }else if (copyFromChildren) {
                copyAllMetaFromChildren(thisId)
            }
        }else if(((newTags.isPresent && tagCount > 0) || (newAuthors.isPresent && authorCount > 0) || (newTopics.isPresent && topicCount > 0))
                && (newAuthors.isPresent || authorCount == 0)
                && (newTopics.isPresent || topicCount == 0)
                && (newTags.isPresent || tagCount == 0)) {
            //若发现未修改列表数量都为0，已修改至少一项不为0，那么清空未修改列表从依赖项那里获得的exported tag
            //在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
            //tips: 这里的判断逻辑我看不懂了……出了个bug修好了，但这里为什么是这么写的？
            if(newTags.isUndefined) metaManager.deleteMetaTags(thisId, IllustTagRelations, Tags, analyseStatisticCount)
            if(newAuthors.isUndefined) metaManager.deleteMetaTags(thisId, IllustAuthorRelations, Authors, analyseStatisticCount)
            if(newTopics.isUndefined) metaManager.deleteMetaTags(thisId, IllustTopicRelations, Topics, analyseStatisticCount)
            metaManager.deleteAnnotations(thisId, IllustAnnotationRelations)
        }

        val tagAnnotations = if(newTags.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, analyseStatisticCount,
                metaTag = Tags,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.validateAndExportTag(newTags.value))
        val topicAnnotations = if(newTopics.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, analyseStatisticCount,
                metaTag = Topics,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.validateAndExportTopic(newTopics.value))
        val authorAnnotations = if(newAuthors.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, analyseStatisticCount,
                metaTag = Authors,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.validateAndExportAuthor(newAuthors.value))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)
    }

    /**
     * 在没有更新的情况下，强制重新导出meta tag。被使用在meta exporter的后台任务中。
     */
    fun forceProcessAllMeta(thisId: Int, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        val tags = metaManager.getNotExportMetaTags(thisId, IllustTagRelations, Tags)
        val topics = metaManager.getNotExportMetaTags(thisId, IllustTopicRelations, Topics)
        val authors = metaManager.getNotExportMetaTags(thisId, IllustAuthorRelations, Authors)

        val tagCount = tags.size
        val topicCount = topics.size
        val authorCount = authors.size

        fun deleteAllMeta(remainNotExported: Boolean = false) {
            if(tagCount == 0) metaManager.deleteMetaTags(thisId, IllustTagRelations, Tags, analyseStatisticCount, remainNotExported)
            if(authorCount == 0) metaManager.deleteMetaTags(thisId, IllustAuthorRelations, Authors, analyseStatisticCount, remainNotExported)
            if(topicCount == 0) metaManager.deleteMetaTags(thisId, IllustTopicRelations, Topics, analyseStatisticCount, remainNotExported)
            metaManager.deleteAnnotations(thisId, IllustAnnotationRelations)
        }

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag。在拷贝之前，清空全列表，防止duplicated key。
            if (copyFromChildren) {
                deleteAllMeta()
                copyAllMetaFromChildren(thisId)
            }else if(copyFromParent != null && anyNotExportedMeta(copyFromParent)) {
                deleteAllMeta()
                copyAllMetaFromParent(thisId, copyFromParent)
            }
        }else if(tagCount > 0 || topicCount > 0 || authorCount > 0) {
            //至少一个列表不为0时，清空所有为0的列表的全部tag
            //在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
            deleteAllMeta(remainNotExported = true)

            val tagAnnotations = metaManager.processMetaTags(thisId, false, analyseStatisticCount,
                metaTag = Tags,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.exportTag(tags, conflictingMembersCheck = false))
            val topicAnnotations = metaManager.processMetaTags(thisId, false, analyseStatisticCount,
                metaTag = Topics,
                metaRelations = IllustTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.exportTopic(topics))
            val authorAnnotations = metaManager.processMetaTags(thisId, false, analyseStatisticCount,
                metaTag = Authors,
                metaRelations = IllustAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.exportAuthor(authors))

            processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)
        }
    }

    /**
     * 使用目标的所有relations，拷贝一份赋给当前项，统一设定为exported。
     */
    fun copyAllMetaFromParent(thisId: Int, fromId: Int) {
        val now = DateTime.now()
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
                where { it.id inList ids }
                set(it.cachedCount, it.cachedCount plus 1)
                set(it.updateTime, now)
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
     * 从当前项的所有子项拷贝全部的meta，统一设定为exported。
     */
    private fun copyAllMetaFromChildren(thisId: Int) {
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
        return metaManager.getNotExportedMetaCount(id, IllustTagRelations) > 0 || metaManager.getNotExportedMetaCount(id, IllustAuthorRelations) > 0 || metaManager.getNotExportedMetaCount(id, IllustTopicRelations) > 0
    }

    /**
     * 校验collection的images列表的正确性。
     * 要求必须存在至少一项，检查是否有不存在或不合法的项。
     * @return 导出那些exported属性(fileId, score, partitionTime, orderTime)
     */
    fun validateSubImages(imageIds: List<Int>): Tuple5<List<Illust>, Int, Int?, LocalDate, Long> {
        if(imageIds.isEmpty()) throw ParamRequired("images")
        val result = data.db.sequenceOf(Illusts).filter { it.id inList imageIds }.toList()
        //数量不够表示有imageId不存在
        if(result.size < imageIds.size) throw ResourceNotExist("images", imageIds.toSet() - result.asSequence().map { it.id }.toSet())

        val images = ArrayList<Illust>(result.size).run {
            for (item in result) {
                //按照type分类处理
                if(item.type == Illust.Type.COLLECTION) {
                    //对于collection，做一个易用性处理，将它们的所有子项包括在images列表中
                    addAll(data.db.sequenceOf(Illusts).filter { it.parentId eq item.id }.asKotlinSequence())
                }else{
                    //对于image/image_with_parent，直接加入images列表
                    add(item)
                }
            }
            distinct()
        }

        val firstImage = images.minByOrNull { it.orderTime }!!
        val fileId = firstImage.fileId
        val partitionTime = firstImage.partitionTime
        val orderTime = firstImage.orderTime
        val score = images.asSequence().mapNotNull { it.score }.average().run { if(isNaN()) null else this }?.roundToInt()

        return Tuple5(images, fileId, score, partitionTime, orderTime)
    }
}