package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.album.Album
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.entity.toList

class AlbumKit(private val data: DataRepository,
               private val metaManager: MetaManager) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(score <= 0 || score > data.metadata.meta.scoreMaximum) throw ParamError("score")
    }

    /**
     * 检查全部的subtitle序列，不允许ordinal的值超限，并对subtitle排序。
     */
    fun validateAllSubtitles(subtitles: List<Album.Subtitle>, count: Int): List<Album.Subtitle> {
        TODO()
    }

    /**
     * 在没有更新的情况下，强制重新导出meta tag。被使用在meta exporter的后台任务中。
     */
    fun forceProcessAllMeta(thisId: Int) {
        val tags = metaManager.getNotExportMetaTags(thisId, AlbumTagRelations, Tags)
        val topics = metaManager.getNotExportMetaTags(thisId, AlbumTopicRelations, Topics)
        val authors = metaManager.getNotExportMetaTags(thisId, AlbumAuthorRelations, Authors)

        val tagCount = tags.size
        val topicCount = topics.size
        val authorCount = authors.size

        fun deleteAllMeta(remainNotExported: Boolean = false) {
            if(tagCount == 0) metaManager.deleteMetaTags(thisId, AlbumTagRelations, Tags, false, remainNotExported)
            if(authorCount == 0) metaManager.deleteMetaTags(thisId, AlbumAuthorRelations, Authors, false, remainNotExported)
            if(topicCount == 0) metaManager.deleteMetaTags(thisId, AlbumTopicRelations, Topics, false, remainNotExported)
            metaManager.deleteAnnotations(thisId, AlbumAnnotationRelations)
        }

        if(tagCount == 0 && topicCount == 0 && authorCount == 0) {
            //若发现当前列表数全部为0，那么从依赖项拷贝tag。在拷贝之前，清空全列表，防止duplicated key。
            deleteAllMeta()
            copyAllMetaFromImages(thisId)
        }else{
            //至少一个列表不为0时，清空所有为0的列表的全部tag
            deleteAllMeta(remainNotExported = true)

            val tagAnnotations = metaManager.processMetaTags(thisId, creating = false, analyseStatisticCount = false,
                metaTag = Tags,
                metaRelations = AlbumTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.exportTag(tags, conflictingMembersCheck = false))
            val topicAnnotations = metaManager.processMetaTags(thisId, creating = false, analyseStatisticCount = false,
                metaTag = Topics,
                metaRelations = AlbumTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.exportTopic(topics))
            val authorAnnotations = metaManager.processMetaTags(thisId, creating = false, analyseStatisticCount = false,
                metaTag = Authors,
                metaRelations = AlbumAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.exportAuthor(authors))

            processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)
        }
    }

    /**
     * 当关联的meta变化时，会引发间接关联的annotation的变化，处理这种变化。
     */
    private fun processAnnotationOfMeta(thisId: Int, tagAnnotations: Set<Int>?, authorAnnotations: Set<Int>?, topicAnnotations: Set<Int>?) {
        if(tagAnnotations != null || topicAnnotations != null || authorAnnotations != null) {
            val oldAnnotations = data.db.from(AlbumAnnotationRelations).select()
                .where { AlbumAnnotationRelations.albumId eq thisId }
                .asSequence()
                .map { Pair(it[AlbumAnnotationRelations.annotationId]!!, it[AlbumAnnotationRelations.exportedFrom]!!) }
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

            if(adds.isNotEmpty()) data.db.batchInsert(AlbumAnnotationRelations) {
                for ((addId, exportedFrom) in adds) {
                    item {
                        set(it.albumId, thisId)
                        set(it.annotationId, addId)
                        set(it.exportedFrom, exportedFrom)
                    }
                }
            }
            if(changes.isNotEmpty()) data.db.batchUpdate(AlbumAnnotationRelations) {
                for ((changeId, exportedFrom) in changes) {
                    item {
                        where { (it.albumId eq thisId) and (it.annotationId eq changeId) }
                        set(it.exportedFrom, exportedFrom)
                    }
                }
            }
            if(deletes.isNotEmpty()) data.db.delete(AlbumAnnotationRelations) { (it.albumId eq thisId) and (it.annotationId inList deletes) }
        }
    }

    /**
     * 从所有子项拷贝meta并处理合并，统一设定为exported。
     * album的子项合并和collection不同，它按照一个出现频率的阈值取一部分tag。
     * album的annotations导出则是根据导出的meta tag，重新导出annotations。
     */
    private fun copyAllMetaFromImages(thisId: Int) {
        fun <IR : EntityMetaRelationTable<*>, AR:EntityMetaRelationTable<*>> copyOneMeta(imageTagRelations: IR, albumTagRelations: AR): List<Int> {
            val metaTags = data.db.from(AlbumImageRelations)
                .innerJoin(Illusts, AlbumImageRelations.imageId eq Illusts.id)
                .innerJoin(imageTagRelations, imageTagRelations.entityId() eq Illusts.id)
                .select(imageTagRelations.metaId(), count(imageTagRelations.entityId()).aliased("count"))
                .where { AlbumImageRelations.albumId eq thisId }
                .groupBy(imageTagRelations.metaId())
                .map { it[imageTagRelations.metaId()]!! to it.getInt("count") }
            if(metaTags.isNotEmpty()) {
                //临界阈值是30%，即出现频数超过最大频数的这个比率的标签会被选入。
                val conditionCount = (metaTags.maxOf { (_, count) -> count } * 0.3).toInt()
                val selectedTags = metaTags.filter { (_, count) -> count >= conditionCount }.map { (id, _) -> id }
                if(selectedTags.isNotEmpty()) {
                    data.db.batchInsert(albumTagRelations) {
                        for (tagId in selectedTags) {
                            item {
                                set(it.entityId(), thisId)
                                set(it.metaId(), tagId)
                                set(it.exported(), true)
                            }
                        }
                    }
                    return selectedTags
                }
            }
            return emptyList()
        }

        fun copyAnnotationOfMeta(tagIds: List<Int>, authorIds: List<Int>, topicIds: List<Int>) {
            val tagAnnotations = metaManager.getAnnotationsOfMetaTags(tagIds, TagAnnotationRelations)
            val authorAnnotations = metaManager.getAnnotationsOfMetaTags(authorIds, AuthorAnnotationRelations)
            val topicAnnotations = metaManager.getAnnotationsOfMetaTags(topicIds, TopicAnnotationRelations)

            if(tagAnnotations.isNotEmpty() || authorAnnotations.isNotEmpty() || topicAnnotations.isNotEmpty()) {
                val adds = mutableMapOf<Int, Annotation.ExportedFrom>()
                tagAnnotations.forEach {
                    adds[it] = if(it !in adds) Annotation.ExportedFrom.TAG
                    else adds[it]!!.plus(Annotation.ExportedFrom.TAG)
                }
                topicAnnotations.forEach {
                    adds[it] = if(it !in adds) Annotation.ExportedFrom.TOPIC
                    else adds[it]!!.plus(Annotation.ExportedFrom.TOPIC)
                }
                authorAnnotations.forEach {
                    adds[it] = if(it !in adds) Annotation.ExportedFrom.AUTHOR
                    else adds[it]!!.plus(Annotation.ExportedFrom.AUTHOR)
                }
                if(adds.isNotEmpty()) data.db.batchInsert(AlbumAnnotationRelations) {
                    for ((addId, exportedFrom) in adds) {
                        item {
                            set(it.albumId, thisId)
                            set(it.annotationId, addId)
                            set(it.exportedFrom, exportedFrom)
                        }
                    }
                }
            }
        }

        val tagIds = copyOneMeta(IllustTagRelations, AlbumTagRelations)
        val authorIds = copyOneMeta(IllustAuthorRelations, AlbumAuthorRelations)
        val topicIds = copyOneMeta(IllustTopicRelations, AlbumTopicRelations)

        copyAnnotationOfMeta(tagIds, authorIds, topicIds)
    }

    /**
     * 校验album的images列表的正确性。
     * @return 导出exported属性(fileId)
     */
    fun validateSubImages(imageIds: List<Int>): Pair<List<Int>, Int?> {
        if(imageIds.isEmpty()) return Pair(emptyList(), null)

        val images = data.db.from(Illusts)
            .select(Illusts.id, Illusts.fileId)
            .where { (Illusts.id inList imageIds) and (Illusts.type notEq Illust.Type.COLLECTION) }
            .map { Pair(it[Illusts.id]!!, it[Illusts.fileId]!!) }
            .toMap()
        //数量不够表示有imageId不存在(或类型是collection，被一同判定为不存在)
        if(images.size < imageIds.size) throw ResourceNotExist("images", imageIds.toSet() - images.keys)

        val fileId = images[imageIds.first()]!!

        return Pair(imageIds, fileId)
    }

    /**
     * 应用images列表。
     */
    fun processSubImages(imageIds: List<Int>, thisId: Int) {
        data.db.delete(AlbumImageRelations) { it.albumId eq thisId }
        data.db.batchInsert(AlbumImageRelations) {
            imageIds.forEachIndexed { index, imageId ->
                item {
                    set(it.albumId, thisId)
                    set(it.imageId, imageId)
                    set(it.ordinal, index)
                }
            }
        }
    }
}