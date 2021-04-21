package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.album.AlbumImageRelation
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.tools.checkScore
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.Opt
import org.ktorm.dsl.*
import org.ktorm.entity.*

class AlbumKit(private val data: DataRepository,
               private val metaManager: MetaManager) {
    /**
     * 检查score的值，不允许其超出范围。
     */
    fun validateScore(score: Int) {
        if(!checkScore(score)) throw ParamError("score")
    }

    /**
     * 检验给出的tags/topics/authors的正确性，处理导出，并应用其更改。此外，annotations的更改也会被一并导出处理。
     */
    fun processAllMeta(thisId: Int, newTags: Opt<List<Int>>, newTopics: Opt<List<Int>>, newAuthors: Opt<List<Int>>,
                       creating: Boolean = false) {
        val tagAnnotations = if(newTags.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, false,
                metaTag = Tags,
                metaRelations = AlbumTagRelations,
                metaAnnotationRelations = TagAnnotationRelations,
                newTagIds = metaManager.validateAndExportTag(newTags.value))
        val topicAnnotations = if(newTopics.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, false,
                metaTag = Topics,
                metaRelations = AlbumTopicRelations,
                metaAnnotationRelations = TopicAnnotationRelations,
                newTagIds = metaManager.validateAndExportTopic(newTopics.value))
        val authorAnnotations = if(newAuthors.isUndefined) null else
            metaManager.processMetaTags(thisId, creating, false,
                metaTag = Authors,
                metaRelations = AlbumAuthorRelations,
                metaAnnotationRelations = AuthorAnnotationRelations,
                newTagIds = metaManager.validateAndExportAuthor(newAuthors.value))

        processAnnotationOfMeta(thisId, tagAnnotations = tagAnnotations, topicAnnotations = topicAnnotations, authorAnnotations = authorAnnotations)
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
     * 重新计算项目数量和封面的fileId。
     */
    fun exportFileAndCount(thisId: Int) {
        val fileId = data.db.from(AlbumImageRelations)
            .innerJoin(Illusts, AlbumImageRelations.imageId eq Illusts.id)
            .select(Illusts.fileId)
            .where { AlbumImageRelations.albumId eq thisId }
            .orderBy(AlbumImageRelations.ordinal.asc())
            .limit(0, 1)
            .firstOrNull()
            ?.let { it[Illusts.fileId]!! }
        val count = data.db.sequenceOf(AlbumImageRelations).count { it.albumId eq thisId }

        data.db.update(Albums) {
            where { it.id eq thisId }
            set(it.cachedCount, count)
            set(it.fileId, fileId)
        }
    }

    /**
     * 校验album的sub items列表的正确性。列表的值只允许是string(subtitle)或int(image id)。subtitle不允许为空值。
     * @return (全items列表, image类型的项目数, 封面fileId)
     */
    fun validateSubImages(items: List<Int>): Triple<List<Int>, Int, Int?> {
        if(items.isEmpty()) return Triple(emptyList(), 0, null)

        val images = data.db.from(Illusts)
            .select(Illusts.id, Illusts.fileId)
            .where { (Illusts.id inList items) and (Illusts.type notEq Illust.Type.COLLECTION) }
            .map { Pair(it[Illusts.id]!!, it[Illusts.fileId]!!) }
            .toMap()
        //数量不够表示有imageId不存在(或类型是collection，被一同判定为不存在)
        if(images.size < items.size) throw ResourceNotExist("images", items.toSet() - images.keys)

        val fileId = if(items.isNotEmpty()) images[items.first()] else null

        return Triple(items, items.size, fileId)
    }

    /**
     * 应用images列表。对列表进行整体替换。
     */
    fun processSubImages(items: List<Int>, thisId: Int) {
        data.db.delete(AlbumImageRelations) { it.albumId eq thisId }
        data.db.batchInsert(AlbumImageRelations) {
            items.forEachIndexed { index, imageId ->
                item {
                    set(it.albumId, thisId)
                    set(it.ordinal, index)
                    set(it.imageId, imageId)
                }
            }
        }
    }

    /**
     * 插入新的images。
     */
    fun insertSubImages(items: List<Int>, thisId: Int, ordinal: Int?) {
        val count = data.db.sequenceOf(AlbumImageRelations).count { it.albumId eq thisId }
        val insertOrdinal = if(ordinal != null && ordinal <= count) ordinal else count
        //先把原有位置的项向后挪动
        data.db.update(AlbumImageRelations) {
            where { (it.albumId eq thisId) and (it.ordinal greaterEq insertOrdinal) }
            set(it.ordinal, it.ordinal plus items.size)
        }
        //然后插入新项
        data.db.batchInsert(AlbumImageRelations) {
            items.forEachIndexed { index, imageId ->
                item {
                    set(it.albumId, thisId)
                    set(it.ordinal, insertOrdinal + index)
                    set(it.imageId, imageId)
                }
            }
        }
    }

    /**
     * 移动一部分images的顺序。
     */
    fun moveSubImages(indexes: List<Int>, thisId: Int, ordinal: Int?) {
        if(indexes.isNotEmpty()) {
            val sortedIndexes = indexes.sorted()
            val count = data.db.sequenceOf(AlbumImageRelations).count { it.albumId eq thisId }
            val insertOrdinal = if(ordinal != null && ordinal <= count) ordinal else count
            val itemMap = data.db.sequenceOf(AlbumImageRelations)
                .filter { (it.albumId eq thisId) and (it.ordinal inList indexes) }
                .map { it.ordinal to it }.toMap()

            if(itemMap.size < indexes.size) throw ResourceNotExist("itemIndexes", indexes.toSet() - itemMap.keys)
            //先删除所有要移动的项
            data.db.delete(AlbumImageRelations) { (it.albumId eq thisId) and (it.ordinal inList indexes) }
            //将余下的项向前缩进
            data.db.batchUpdate(AlbumImageRelations) {
                sortedIndexes.asSequence()
                    .windowed(2, 1, true) { it[0] to it.getOrElse(1) { count } }
                    .forEachIndexed { index, (fromOrdinal, toOrdinal) ->
                        item {
                            where { (it.albumId eq thisId) and (it.ordinal greaterEq fromOrdinal) and (it.ordinal less toOrdinal) }
                            set(it.ordinal, it.ordinal minus (index + 1))
                        }
                    }
            }
            //再向后挪动空出位置
            data.db.update(AlbumImageRelations) {
                where { (it.albumId eq thisId) and (it.ordinal greaterEq insertOrdinal) }
                set(it.ordinal, it.ordinal plus indexes.size)
            }
            //重新插入要移动的项
            data.db.batchInsert(AlbumImageRelations) {
                //迭代这部分要移动的项目列表。迭代的是原始列表，没有经过排序
                indexes.forEachIndexed { index, thisIndex ->
                    //从map中取出对应的relation项
                    val r = itemMap[thisIndex]!!
                    item {
                        set(it.albumId, thisId)
                        set(it.ordinal, insertOrdinal + index)
                        set(it.imageId, r.imageId)
                    }
                }
            }
        }
    }

    /**
     * 删除一部分images。
     */
    fun deleteSubImages(indexes: List<Int>, thisId: Int) {
        if(indexes.isNotEmpty()) {
            val sortedIndexes = indexes.sorted()
            val count = data.db.sequenceOf(AlbumImageRelations).count { it.albumId eq thisId }
            if(sortedIndexes.last() >= count) throw ResourceNotExist("itemIndexes", indexes.filter { it >= count })
            //删除
            data.db.delete(AlbumImageRelations) { (it.albumId eq thisId) and (it.ordinal inList indexes) }
            //将余下的项向前缩进
            data.db.batchUpdate(AlbumImageRelations) {
                sortedIndexes.asSequence()
                    .windowed(2, 1, true) { it[0] to it.getOrElse(1) { count } }
                    .forEachIndexed { index, (fromOrdinal, toOrdinal) ->
                        item {
                            where { (it.albumId eq thisId) and (it.ordinal greaterEq fromOrdinal) and (it.ordinal less toOrdinal) }
                            set(it.ordinal, it.ordinal minus (index + 1))
                        }
                    }
            }
        }
    }
}