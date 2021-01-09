package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.backend.MetaExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.tools.*
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.first
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.expression.BinaryExpression

class IllustService(private val data: DataRepository,
                    private val kit: IllustKit,
                    private val illustManager: IllustManager,
                    private val fileManager: FileManager,
                    private val relationManager: RelationManager,
                    private val sourceManager: SourceManager,
                    private val partitionManager: PartitionManager,
                    private val illustMetaExporter: IllustMetaExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Illusts.id
        "createTime" to Illusts.createTime
        "updateTime" to Illusts.updateTime
        "orderTime" to Illusts.orderTime
        "score" to Illusts.exportedScore nulls last
    }

    fun list(filter: IllustQueryFilter): QueryResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .whereWithConditions {
                it += when(filter.type) {
                    Illust.IllustType.COLLECTION -> (Illusts.type eq Illust.Type.COLLECTION) or (Illusts.type eq Illust.Type.IMAGE)
                    Illust.IllustType.IMAGE -> (Illusts.type eq Illust.Type.IMAGE) or (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT)
                }
                if(filter.partition != null) {
                    it += Illusts.partitionTime eq filter.partition
                }
                //TODO 实现QL查询
            }
            .limit(filter.offset, filter.limit)
            .orderBy(filter.order, orderTranslator)
            .toQueryResult(emptyList()) {
                val id = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                IllustRes(id, type, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    fun get(id: Int, type: Illust.IllustType): IllustDetailRes {
        val row = data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(FileRecords.id, FileRecords.folder, FileRecords.extension,
                Illusts.description, Illusts.score,
                Illusts.exportedDescription, Illusts.exportedScore, Illusts.favorite, Illusts.tagme,
                Illusts.partitionTime, Illusts.orderTime, Illusts.createTime, Illusts.updateTime)
            .where { retrieveCondition(id, type) }
            .firstOrNull()
            ?: throw NotFound()

        val fileId = row[FileRecords.id]!!
        val file = takeFilepath(row)

        val originDescription = row[Illusts.description]!!
        val originScore = row[Illusts.score]
        val description = row[Illusts.exportedDescription]!!
        val score = row[Illusts.exportedScore]
        val favorite = row[Illusts.favorite]!!
        val tagme = row[Illusts.tagme]!!
        val partitionTime = row[Illusts.partitionTime]!!
        val orderTime = row[Illusts.orderTime]!!.parseDateTime()
        val createTime = row[Illusts.createTime]!!
        val updateTime = row[Illusts.updateTime]!!

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, IllustTopicRelations.isExported)
            .where { IllustTopicRelations.illustId eq id }
            .map { TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, it[IllustTopicRelations.isExported]!!) }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, IllustAuthorRelations.isExported)
            .where { IllustAuthorRelations.illustId eq id }
            .map { AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, it[IllustAuthorRelations.isExported]!!) }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (IllustTagRelations.illustId eq id) and (Tags.type eq Tag.Type.TAG) }
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return IllustDetailRes(
            id, fileId, file,
            topics, authors, tags,
            description, score, favorite, tagme,
            originDescription, originScore,
            partitionTime, orderTime, createTime, updateTime
        )
    }

    fun getCollectionRelatedItems(id: Int): IllustCollectionRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.exportedRelations, Illusts.relations)
            .where { retrieveCondition(id, Illust.IllustType.COLLECTION) }
            .firstOrNull()
            ?: throw NotFound()

        val originRelations = row[Illusts.relations] ?: emptyList()
        val relationIds = row[Illusts.exportedRelations]
        val relationMap = if(relationIds.isNullOrEmpty()) emptyMap() else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { Illusts.id inList relationIds }
            .asSequence()
            .map {
                val subId = it[Illusts.id]!!
                val thumbnailFile = takeThumbnailFilepath(it)
                Pair(subId, IllustSimpleRes(subId, thumbnailFile))
            }
            .toMap()

        return IllustCollectionRelatedRes(relations = relationIds?.map { relationMap[it]!! } ?: emptyList(), originRelations)
    }

    fun getCollectionImages(id: Int, filter: LimitAndOffsetFilter): ListResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { (Illusts.parentId eq id) and (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
            .limit(filter.offset, filter.limit)
            .orderBy(Illusts.orderTime.asc())
            .toListResult {
                val itemId = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                IllustRes(itemId, type, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    fun getImageRelatedItems(id: Int): IllustImageRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.exportedRelations, Illusts.relations, Illusts.parentId)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw NotFound()
        val originRelations = row[Illusts.relations] ?: emptyList()
        val relationIds = row[Illusts.exportedRelations]
        val parentId = row[Illusts.parentId]

        val relationMap = if(relationIds.isNullOrEmpty()) emptyMap() else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { Illusts.id inList relationIds }
            .asSequence()
            .map {
                val subId = it[Illusts.id]!!
                val thumbnailFile = takeThumbnailFilepath(it)
                Pair(subId, IllustSimpleRes(subId, thumbnailFile))
            }
            .toMap()
        val relations = relationIds?.map { relationMap[it]!! } ?: emptyList()

        val parent = if(parentId == null) null else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { Illusts.id eq parentId }
            .firstOrNull()
            ?.let { IllustSimpleRes(it[Illusts.id]!!, takeThumbnailFilepath(it)) }

        val albums = data.db.from(Albums)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
            .select(Albums.id, Albums.title)
            .where { AlbumImageRelations.imageId eq id }
            .map { AlbumSimpleRes(it[Albums.id]!!, it[Albums.title]!!) }

        return IllustImageRelatedRes(parent, relations, albums, originRelations)
    }

    fun getImageOriginData(id: Int): IllustImageOriginRes {
        val row = data.db.from(Illusts)
            .select(Illusts.source, Illusts.sourceId, Illusts.sourcePart)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw NotFound()

        val source = row[Illusts.source]
        val sourceId = row[Illusts.sourceId]
        val sourcePart = row[Illusts.sourcePart]
        if(source != null && sourceId != null && sourcePart != null) {
            val sourceTitle = data.metadata.source.sites.find { it.name == source }?.title
            val sourceRow = data.db.from(SourceImages).select()
                .where { (SourceImages.source eq source) and (SourceImages.sourceId eq sourceId) and (SourceImages.sourcePart eq sourcePart) }
                .firstOrNull()
            return if(sourceRow != null) {
                val relation = sourceRow[SourceImages.relations]
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart.takeIf { it != -1 },
                    sourceRow[SourceImages.title], sourceRow[SourceImages.description], sourceRow[SourceImages.tags] ?: emptyList(),
                    relation?.pools ?: emptyList(), relation?.children ?: emptyList(), relation?.parents ?: emptyList())
            }else{
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart.takeIf { it != -1 },
                    null, null, emptyList(), emptyList(), emptyList(), emptyList())
            }
        }
        return IllustImageOriginRes(null, null, null, null, null, null, null, null, null, null)
    }

    fun createCollection(form: IllustCollectionCreateForm): Int {
        if(form.score != null) kit.validateScore(form.score)
        data.db.transaction {
            return illustManager.newCollection(form.images, form.description ?: "", form.score, form.favorite, form.tagme)
        }
    }

    fun updateCollection(id: Int, form: IllustCollectionUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.COLLECTION) } ?: throw NotFound()

            form.score.alsoOpt {
                if(it != null) kit.validateScore(it)
            }
            val newExportedScore = form.score.letOpt {
                it ?: data.db.from(Illusts)
                    .select(count(Illusts.id).aliased("count"), avg(Illusts.score).aliased("score"))
                    .where { (Illusts.parentId eq id) and (Illusts.score.isNotNull()) }
                    .firstOrNull()?.run {
                        if(getInt("count") > 0) getInt("score") else null
                    }
            }

            val newDescription = form.description.letOpt { it ?: "" }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                //对meta做partial update计算
                val anyNotExported = kit.processAllMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics)
                if(!anyNotExported) {
                    kit.copyAllMetaFromChildren(id)
                }
            }

            val newTagme = if(form.tagme.isPresent) form.tagme else if(data.metadata.meta.autoCleanTagme && anyOpt(form.tags, form.authors, form.topics)) {
                Opt(illust.tagme
                    .runIf(form.tags.isPresent) { this - Illust.Tagme.TAG }
                    .runIf(form.authors.isPresent) { this - Illust.Tagme.AUTHOR }
                    .runIf(form.topics.isPresent) { this - Illust.Tagme.TOPIC }
                )
            }else undefined()

            if(anyOpt(newTagme, newDescription, form.score, form.favorite)) {
                data.db.update(Illusts) {
                    where { it.id eq id }
                    newTagme.applyOpt { set(it.tagme, this) }
                    newDescription.applyOpt {
                        set(it.description, this)
                        set(it.exportedDescription, this)
                    }
                    form.score.applyOpt { set(it.score, this) }
                    newExportedScore.applyOpt { set(it.exportedScore, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                }
            }

            if(anyOpt(form.tags, form.authors, form.topics, form.description, form.score)) {
                //TODO 细化metaExporter的任务。这里要细化到是因为<parent的变化>引起的<description/meta/score>的重导出，以优化重导出效率。
                val children = data.db.from(Illusts).select(Illusts.id).where { Illusts.parentId eq id }.map { it[Illusts.id]!! }
                illustMetaExporter.appendNewTask(children.map { MetaExporterTask(MetaExporterTask.Type.ILLUST, it) })
            }
        }
    }

    fun updateCollectionRelatedItems(id: Int, form: IllustCollectionRelatedUpdateForm) {
        data.db.transaction {
            val row = data.db.from(Illusts).select(Illusts.relations, Illusts.exportedRelations)
                .where { retrieveCondition(id, Illust.IllustType.COLLECTION) }
                .firstOrNull()
                ?: throw NotFound()

            val oldRelations = row[Illusts.relations]
            val oldExportedRelations = row[Illusts.exportedRelations]

            relationManager.validateRelations(form.relations)
            data.db.update(Illusts) {
                where { it.id eq id }
                set(it.relations, form.relations)
            }
            relationManager.processExportedRelations(id, form.relations, oldRelations, oldExportedRelations)
        }
    }

    fun updateCollectionImages(id: Int, imageIds: List<Int>) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).filter { retrieveCondition(id, Illust.IllustType.COLLECTION) }.firstOrNull() ?: throw NotFound()

            val (images, fileId, scoreFromSub, partitionTime, orderTime) = kit.validateSubImages(imageIds)
            val now = DateTime.now()

            data.db.update(Illusts) {
                where { it.id eq id }
                set(it.fileId, fileId)
                set(it.exportedScore, illust.score ?: scoreFromSub)
                set(it.partitionTime, partitionTime)
                set(it.orderTime, orderTime)
                set(it.updateTime, now)
            }

            kit.processSubImages(images, id, illust.description, illust.score)
        }
    }

    fun updateImage(id: Int, form: IllustImageUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.IMAGE) } ?: throw NotFound()

            val parent by lazy { if(illust.parentId == null) null else
                data.db.sequenceOf(Illusts).first { (Illusts.type eq Illust.Type.COLLECTION) and (Illusts.id eq illust.parentId) }
            }

            form.score.alsoOpt {
                if(it != null) kit.validateScore(it)
            }
            val newExportedScore = form.score.letOpt { it ?: parent?.score }

            val newDescription = form.description.letOpt { it ?: "" }
            val newExportedDescription = newDescription.letOpt { if(it.isEmpty()) parent?.description ?: "" else it }

            form.partitionTime.alsoOpt {
                if(illust.partitionTime != it) partitionManager.updateItemPartition(illust.partitionTime, it)
            }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                //对meta做partial update计算
                val anyNotExported = kit.processAllMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics)
                //当存在parent，且parent存在not exported meta tag，且meta的结果为全空时，从parent复制tag
                if(!anyNotExported && illust.parentId != null && kit.anyNotExportedMeta(illust.parentId)) kit.copyAllMeta(id, illust.parentId)
                //TODO 设计缺陷：在现有meta全部从parent拷贝的情况下，只设置一个种类的meta，那只有那一个种类的meta会重设，其他种类还是维持拷贝
            }

            val newTagme = if(form.tagme.isPresent) form.tagme else if(data.metadata.meta.autoCleanTagme && anyOpt(form.tags, form.authors, form.topics)) {
                Opt(illust.tagme
                    .runIf(form.tags.isPresent) { this - Illust.Tagme.TAG }
                    .runIf(form.authors.isPresent) { this - Illust.Tagme.AUTHOR }
                    .runIf(form.topics.isPresent) { this - Illust.Tagme.TOPIC }
                )
            }else undefined()

            if(anyOpt(newTagme, newDescription, newExportedDescription, form.score, newExportedScore, form.favorite, form.partitionTime, form.orderTime)) {
                data.db.update(Illusts) {
                    where { it.id eq id }
                    newTagme.applyOpt { set(it.tagme, this) }
                    newDescription.applyOpt { set(it.description, this) }
                    newExportedDescription.applyOpt { set(it.exportedDescription, this) }
                    form.score.applyOpt { set(it.score, this) }
                    newExportedScore.applyOpt { set(it.exportedScore, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                    form.partitionTime.applyOpt { set(it.partitionTime, this) }
                    form.orderTime.applyOpt { set(it.orderTime, this) }
                }
            }

            if(illust.parentId != null
                && ((form.score.isPresent && parent!!.score == null)
                        || (anyOpt(form.tags, form.authors, form.topics) && !kit.anyNotExportedMeta(illust.parentId)))) {
                //设置了score，且parent未设置score时
                //或tags/topics/authors存在更改，且parent不存在任何not exported meta tag时
                //将parent加入更新
                illustMetaExporter.appendNewTask(MetaExporterTask.Type.ILLUST, illust.parentId)
            }
        }
    }

    fun updateImageRelatedItems(id: Int, form: IllustImageRelatedUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.IMAGE) } ?: throw NotFound()

            form.relations.alsoOpt { newRelations ->
                relationManager.validateRelations(newRelations)
                data.db.update(Illusts) {
                    where { it.id eq id }
                    set(it.relations, newRelations)
                }
                relationManager.processExportedRelations(id, newRelations, illust.relations, illust.exportedRelations)
            }

            form.collectionId.alsoOpt { newParentId ->
                if(illust.parentId != newParentId) {
                    val newParent = if(newParentId == null) null else {
                        data.db.sequenceOf(Illusts)
                            .firstOrNull { (it.id eq newParentId) and (it.type eq Illust.Type.COLLECTION) }
                            ?: throw ResourceNotExist("collectionId", newParentId)
                    }
                    data.db.update(Illusts) {
                        where { it.id eq id }
                        set(it.parentId, newParentId)
                        set(it.type, if(newParentId != null) Illust.Type.IMAGE_WITH_PARENT else Illust.Type.IMAGE)
                    }

                    val now = DateTime.now()
                    if(newParent != null) {
                        kit.processAddItemToCollection(newParent.id, illust, now)
                    }
                    if(illust.parentId != null) {
                        //处理旧parent
                        kit.processRemoveItemFromCollection(illust.parentId, illust, now)
                    }
                }
            }
        }
    }

    fun updateImageOriginData(id: Int, form: IllustImageOriginUpdateForm) {
        data.db.transaction {
            val row = data.db.from(Illusts).select(Illusts.source, Illusts.sourceId, Illusts.sourcePart, Illusts.tagme)
                .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
                .firstOrNull()
                ?: throw NotFound()
            val source = row[Illusts.source]
            val sourceId = row[Illusts.sourceId]
            val sourcePart = row[Illusts.sourcePart]
            val tagme = row[Illusts.tagme]!!
            if(form.source.isPresent || form.sourceId.isPresent || form.sourcePart.isPresent) {
                val (newSource, newSourceId, newSourcePart) = sourceManager.createOrUpdateSourceImage(
                    form.source.unwrapOr { source }, form.sourceId.unwrapOr { sourceId }, form.sourcePart.unwrapOr { sourcePart },
                    form.title, form.description, form.tags, form.pools, form.children, form.parents)
                data.db.update(Illusts) {
                    where { it.id eq id }
                    set(it.source, newSource)
                    set(it.sourceId, newSourceId)
                    set(it.sourcePart, newSourcePart)
                    if(data.metadata.meta.autoCleanTagme && Illust.Tagme.SOURCE in tagme) set(it.tagme, tagme - Illust.Tagme.SOURCE)
                }
            }else{
                sourceManager.createOrUpdateSourceImage(source, sourceId, sourcePart, form.title, form.description, form.tags, form.pools, form.children, form.parents)
            }
        }
    }

    fun delete(id: Int, type: Illust.IllustType) {
        data.db.transaction {
            val illust = data.db.from(Illusts).select()
                .where { retrieveCondition(id, type) }
                .firstOrNull()
                ?.let { Illusts.createEntity(it) }
                ?: throw NotFound()

            data.db.delete(Illusts) { it.id eq id }
            data.db.delete(IllustTagRelations) { it.illustId eq id }
            data.db.delete(IllustAuthorRelations) { it.illustId eq id }
            data.db.delete(IllustTopicRelations) { it.illustId eq id }
            data.db.delete(IllustAnnotationRelations) { it.illustId eq id }

            if(!illust.exportedRelations.isNullOrEmpty()) relationManager.removeItemInRelations(id, illust.exportedRelations)

            if(type == Illust.IllustType.IMAGE) {
                //TODO 从所有关联的album中平滑移除此image(需要平滑ordinal)
                //TODO 从所有关联的folder中平滑移除此image(需要平滑ordinal)
                //关联的partition的计数-1
                partitionManager.deleteItemInPartition(illust.partitionTime)
                //存在parent时，执行parent重导出处理。
                if(illust.parentId != null) kit.processRemoveItemFromCollection(illust.parentId, illust)
                //删除关联的file。无法撤销的删除放到最后，这样不必回滚
                fileManager.deleteFile(illust.fileId)
            }else{
                val children = data.db.from(Illusts).select(Illusts.id)
                    .where { Illusts.parentId eq id }
                    .map { it[Illusts.id]!! }
                data.db.update(Illusts) {
                    where { it.parentId eq id }
                    set(it.parentId, null)
                    set(it.type, Illust.Type.IMAGE)
                }
                //对children做重导出
                illustMetaExporter.appendNewTask(children.map { MetaExporterTask(MetaExporterTask.Type.ILLUST, it) })
            }
        }
    }

    private fun retrieveCondition(id: Int, type: Illust.IllustType): BinaryExpression<Boolean> {
        return (Illusts.id eq id) and if(type == Illust.IllustType.COLLECTION) {
            Illusts.type eq Illust.Type.COLLECTION
        }else{
            (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) or (Illusts.type eq Illust.Type.IMAGE)
        }
    }
}