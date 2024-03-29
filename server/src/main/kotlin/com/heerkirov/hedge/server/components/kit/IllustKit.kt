package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.collection.FolderImageRelations
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.dto.ImagePropsCloneForm
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.business.checkScore
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.optOf
import com.heerkirov.hedge.server.utils.types.union
import org.ktorm.dsl.*
import org.ktorm.dsl.where
import org.ktorm.entity.*
import org.ktorm.schema.ColumnDeclaring
import java.time.LocalDate
import kotlin.math.roundToInt

class IllustKit(private val data: DataRepository,
                private val metaManager: MetaManager) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(!checkScore(score)) throw be(ParamError("score"))
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出处理。
     * @param copyFromParent 当当前对象没有任何meta tag关联时，从parent复制tag，并提供parent的id
     * @param copyFromChildren 当当前对象没有任何meta tag关联时，从children复制tag
     * @throws ResourceNotExist ("topics", number[]) 部分topics资源不存在。给出不存在的topic id列表
     * @throws ResourceNotExist ("authors", number[]) 部分authors资源不存在。给出不存在的author id列表
     * @throws ResourceNotExist ("tags", number[]) 部分tags资源不存在。给出不存在的tag id列表
     * @throws ResourceNotSuitable ("tags", number[]) 部分tags资源不适用。地址段不适用于此项。给出不适用的tag id列表
     * @throws ConflictingGroupMembersError 发现标签冲突组
     */
    fun updateMeta(thisId: Int, newTags: Opt<List<Int>>, newTopics: Opt<List<Int>>, newAuthors: Opt<List<Int>>,
                   creating: Boolean = false, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        //检出每种tag的数量。这个数量指新设定的值或已存在的值中notExported的数量
        val tagCount = if(newTags.isPresent) newTags.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustTagRelations)
        val topicCount = if(newTopics.isPresent) newTopics.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustTopicRelations)
        val authorCount = if(newAuthors.isPresent) newAuthors.value.size else if(creating) 0 else metaManager.getNotExportedMetaCount(thisId, IllustAuthorRelations)

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //如果发现所有count都是0，意味着这个illust即将被设置为无metaTag。根据业务规则，此时将寻求从parent或children生成它的metaTag。
            //首先清理现在可能还存在的metaTag。用XXX.isPresent作为判断条件，是因为若有新设值为空，那么可能意味着之前有值；而isUndefined时，旧值一定是空，不需要清理
            if(newTags.isPresent) metaManager.deleteMetaTags(thisId, IllustTagRelations, Tags, analyseStatisticCount)
            if(newAuthors.isPresent) metaManager.deleteMetaTags(thisId, IllustAuthorRelations, Authors, analyseStatisticCount)
            if(newTopics.isPresent) metaManager.deleteMetaTags(thisId, IllustTopicRelations, Topics, analyseStatisticCount)

            if(copyFromParent != null) {
                //如果发现parent有notExported的metaTag，那么从parent直接拷贝全部metaTag
                if(anyNotExportedMetaExists(copyFromParent)) copyAllMetaFromParent(thisId, copyFromParent)
            }else if (copyFromChildren) {
                //从children拷贝全部notExported的metaTag，然后做导出
                copyAllMetaFromChildren(thisId)
            }
        }else if(((newTags.isPresent && tagCount > 0) || (newAuthors.isPresent && authorCount > 0) || (newTopics.isPresent && topicCount > 0)) //这行表示存在任意一项是已修改的
                && (newAuthors.isPresent || authorCount == 0) //这行表示，要么列表数量是0，要么它是已修改的项，也就满足下面的"未修改的列表数量都是0"
                && (newTopics.isPresent || topicCount == 0)
                && (newTags.isPresent || tagCount == 0)) {
            //若发现未修改列表数量都为0，已修改至少一项不为0: 此时从"从依赖项获得exportedTag"的状态转向"自己持有tag"的状态，清除所有metaTag
            //tips: 在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
            metaManager.deleteMetaTags(thisId, IllustTagRelations, Tags, analyseStatisticCount, true)
            metaManager.deleteMetaTags(thisId, IllustAuthorRelations, Authors, analyseStatisticCount, true)
            metaManager.deleteMetaTags(thisId, IllustTopicRelations, Topics, analyseStatisticCount, true)
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
     * 在没有更新的情况下，强制重新导出meta tag。
     */
    fun refreshAllMeta(thisId: Int, copyFromParent: Int? = null, copyFromChildren: Boolean = false) {
        val analyseStatisticCount = !copyFromChildren

        val tags = metaManager.getNotExportMetaTags(thisId, IllustTagRelations, Tags)
        val topics = metaManager.getNotExportMetaTags(thisId, IllustTopicRelations, Topics)
        val authors = metaManager.getNotExportMetaTags(thisId, IllustAuthorRelations, Authors)

        val tagCount = tags.size
        val topicCount = topics.size
        val authorCount = authors.size

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag。在拷贝之前，清空全列表，防止duplicated key。
            deleteAllMeta(thisId, analyseStatisticCount = analyseStatisticCount, tagCount = tagCount, topicCount = topicCount, authorCount = authorCount)
            if (copyFromChildren) {
                copyAllMetaFromChildren(thisId)
            }else if(copyFromParent != null && anyNotExportedMetaExists(copyFromParent)) {
                copyAllMetaFromParent(thisId, copyFromParent)
            }
        }else if(tagCount > 0 || topicCount > 0 || authorCount > 0) {
            //至少一个列表不为0时，清空所有为0的列表的全部tag
            //在copyFromChildren为false的情况下，认为是image的更改，要求修改统计计数；否则不予修改
            deleteAllMeta(thisId, remainNotExported = true, analyseStatisticCount = analyseStatisticCount, tagCount = tagCount, topicCount = topicCount, authorCount = authorCount)

            val tagAnnotations = metaManager.processMetaTags(thisId, false, analyseStatisticCount,
                metaTag = Tags,
                metaRelations = IllustTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.exportTag(tags).first) //直接忽略任何冲突组错误
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
    private fun copyAllMetaFromParent(thisId: Int, fromId: Int) {
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
     * 从当前项的所有子项拷贝notExported的meta，然后统一导出。
     */
    private fun copyAllMetaFromChildren(thisId: Int) {
        //tips: 此处的实现是直接从所有children拷贝所有metaTag。但这并不是正确的实现方法，这么做可能导致exported metaTag在套娃传递。但后续要重构，就先懒得改了
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
     * 删除所有的meta。
     */
    private fun deleteAllMeta(thisId: Int, remainNotExported: Boolean = false, analyseStatisticCount: Boolean? = null,
                              tagCount: Int? = null, authorCount: Int? = null, topicCount: Int? = null) {
        if(tagCount == 0) metaManager.deleteMetaTags(thisId, IllustTagRelations, Tags, analyseStatisticCount ?: false, remainNotExported)
        if(authorCount == 0) metaManager.deleteMetaTags(thisId, IllustAuthorRelations, Authors, analyseStatisticCount ?: false, remainNotExported)
        if(topicCount == 0) metaManager.deleteMetaTags(thisId, IllustTopicRelations, Topics, analyseStatisticCount ?: false, remainNotExported)
        metaManager.deleteAnnotations(thisId, IllustAnnotationRelations)
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
    fun anyNotExportedMetaExists(illustId: Int): Boolean {
        return metaManager.getNotExportedMetaCount(illustId, IllustTagRelations) > 0
                || metaManager.getNotExportedMetaCount(illustId, IllustAuthorRelations) > 0
                || metaManager.getNotExportedMetaCount(illustId, IllustTopicRelations) > 0
    }

    /**
     * 查询一个collection的第一个child。当不存在时抛出NPE。
     */
    fun getFirstChildOfCollection(collectionId: Int): Illust {
        return data.db.sequenceOf(Illusts).sortedBy { it.orderTime }.first { it.parentId eq collectionId }
    }

    /**
     * 从一组images中，获得firstCover导出属性和score导出属性。
     * @return (fileId, score, partitionTime, orderTime)
     */
    fun getExportedPropsFromList(images: List<Illust>): Tuple4<Int, Int?, LocalDate, Long> {
        val firstImage = images.minByOrNull { it.orderTime }!!
        val fileId = firstImage.fileId
        val partitionTime = firstImage.partitionTime
        val orderTime = firstImage.orderTime
        val score = images.asSequence().mapNotNull { it.score }.average().run { if(isNaN()) null else this }?.roundToInt()

        return Tuple4(fileId, score, partitionTime, orderTime)
    }

    /**
     * 重新导出列表中所有images的album flag。随后，再重新导出它们关联的collection。
     */
    fun exportAlbumFlag(imageIds: List<Int>) {
        val images = data.db.from(Illusts)
            .leftJoin(AlbumImageRelations, AlbumImageRelations.imageId eq Illusts.id)
            .select(Illusts.id, Illusts.parentId, count(AlbumImageRelations.albumId).aliased("count"))
            .where { (Illusts.type notEq Illust.Type.COLLECTION) and (Illusts.id inList imageIds) }
            .groupBy(Illusts.id)
            .map { Tuple3(it[Illusts.id]!!, it[Illusts.parentId], it.getInt("count")) }

        if(images.isNotEmpty()) {
            data.db.batchUpdate(Illusts) {
                for ((id, _, cnt) in images) {
                    item {
                        where { it.id eq id }
                        set(it.cachedAlbumCount, cnt)
                    }
                }
            }

            val parentIds = images.mapNotNull { (_, parentId, _) -> parentId }.toSet()
            val j = Illusts.aliased("joined_image")
            @Suppress("UNCHECKED_CAST")
            val parents = data.db.from(Illusts)
                .leftJoin(j, Illusts.id eq j.parentId)
                .select(Illusts.id, sum((j.cachedAlbumCount greater 0) as ColumnDeclaring<Number>).aliased("count"))
                .where { (Illusts.type eq Illust.Type.COLLECTION) and (Illusts.id inList parentIds) }
                .groupBy(Illusts.id)
                .map { Tuple2(it[Illusts.id]!!, it.getInt("count")) }

            if(parents.isNotEmpty()) {
                data.db.batchUpdate(Illusts) {
                    for ((id, cnt) in parents) {
                        item {
                            where { it.id eq id }
                            set(it.cachedAlbumCount, cnt)
                        }
                    }
                }
            }
        }
    }
}