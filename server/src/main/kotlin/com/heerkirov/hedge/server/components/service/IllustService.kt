package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.CollectionExporterTask
import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.backend.ImageExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.dao.source.SourceTagRelations
import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.business.*
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.first
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import org.ktorm.expression.BinaryExpression
import kotlin.math.roundToInt

class IllustService(private val data: DataRepository,
                    private val kit: IllustKit,
                    private val illustManager: IllustManager,
                    private val albumManager: AlbumManager,
                    private val associateManager: AssociateManager,
                    private val folderManager: FolderManager,
                    private val fileManager: FileManager,
                    private val sourceManager: SourceManager,
                    private val partitionManager: PartitionManager,
                    private val queryManager: QueryManager,
                    private val illustMetaExporter: IllustMetaExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Illusts.id
        "createTime" to Illusts.createTime
        "updateTime" to Illusts.updateTime
        "orderTime" to Illusts.orderTime
        "score" to Illusts.exportedScore nulls last
    }

    fun list(filter: IllustQueryFilter): ListResult<IllustRes> {
        val schema = if(filter.query.isNullOrBlank()) null else {
            queryManager.querySchema(filter.query, QueryManager.Dialect.ILLUST).executePlan ?: return ListResult(0, emptyList())
        }
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .let { if(filter.topic == null) it else it.innerJoin(IllustTopicRelations, (IllustTopicRelations.illustId eq Illusts.id) and (IllustTopicRelations.topicId eq filter.topic)) }
            .let { if(filter.author == null) it else it.innerJoin(IllustAuthorRelations, (IllustAuthorRelations.illustId eq Illusts.id) and (IllustAuthorRelations.authorId eq filter.author)) }
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime, Illusts.cachedChildrenCount,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .whereWithConditions {
                it += when(filter.type) {
                    Illust.IllustType.COLLECTION -> (Illusts.type eq Illust.Type.COLLECTION) or (Illusts.type eq Illust.Type.IMAGE)
                    Illust.IllustType.IMAGE -> (Illusts.type eq Illust.Type.IMAGE) or (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT)
                }
                if(filter.partition != null) {
                    it += Illusts.partitionTime eq filter.partition
                }
                if(filter.favorite != null) {
                    it += if(filter.favorite) Illusts.favorite else Illusts.favorite.not()
                }
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(Illusts.id) }
            .limit(filter.offset, filter.limit)
            .orderBy(orderTranslator, filter.order, schema?.orderConditions, default = descendingOrderItem("orderTime"))
            .toListResult {
                val id = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                val childrenCount = it[Illusts.cachedChildrenCount]!!.takeIf { type == Illust.IllustType.COLLECTION }
                IllustRes(id, type, childrenCount, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    fun get(id: Int, type: Illust.IllustType): IllustDetailRes {
        val row = data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status,
                Illusts.description, Illusts.score,
                Illusts.exportedDescription, Illusts.exportedScore, Illusts.favorite, Illusts.tagme,
                Illusts.partitionTime, Illusts.orderTime, Illusts.createTime, Illusts.updateTime)
            .where { retrieveCondition(id, type) }
            .firstOrNull()
            ?: throw NotFound()

        val fileId = row[FileRecords.id]!!
        val (file, thumbnailFile) = takeAllFilepath(row)

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

        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, Topics.type, IllustTopicRelations.isExported)
            .where { IllustTopicRelations.illustId eq id }
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[IllustTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, Authors.type, IllustAuthorRelations.isExported)
            .where { IllustAuthorRelations.illustId eq id }
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[IllustAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (IllustTagRelations.illustId eq id) and (Tags.type eq Tag.Type.TAG) }
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return IllustDetailRes(
            id, fileId, file, thumbnailFile,
            topics, authors, tags,
            description, score, favorite, tagme,
            originDescription, originScore,
            partitionTime, orderTime, createTime, updateTime
        )
    }

    fun getCollectionRelatedItems(id: Int, filter: LimitFilter): IllustCollectionRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.associateId)
            .where { retrieveCondition(id, Illust.IllustType.COLLECTION) }
            .firstOrNull()
            ?: throw NotFound()

        val associateId = row[Illusts.associateId]

        val associate = associateManager.query(associateId, filter.limit)

        return IllustCollectionRelatedRes(associate)
    }

    fun getCollectionImages(id: Int, filter: LimitAndOffsetFilter): ListResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
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
                IllustRes(itemId, type, null, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    fun getImageRelatedItems(id: Int, filter: LimitFilter): IllustImageRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.associateId, Illusts.parentId)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw NotFound()
        val parentId = row[Illusts.parentId]
        val associateId = row[Illusts.associateId]

        val parent = if(parentId == null) null else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.id eq parentId }
            .firstOrNull()
            ?.let { IllustSimpleRes(it[Illusts.id]!!, takeThumbnailFilepath(it)) }

        val albums = data.db.from(Albums)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
            .select(Albums.id, Albums.title)
            .where { AlbumImageRelations.imageId eq id }
            .map { AlbumSimpleRes(it[Albums.id]!!, it[Albums.title]!!) }

        val associate = associateManager.query(associateId, filter.limit)

        return IllustImageRelatedRes(parent, albums, associate)
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
        return if(source != null && sourceId != null) {
            val sourceTitle = data.metadata.source.sites.find { it.name == source }?.title
            val sourceRow = data.db.from(SourceImages).select()
                .where { (SourceImages.source eq source) and (SourceImages.sourceId eq sourceId) }
                .firstOrNull()
            if(sourceRow != null) {
                val sourceRowId = sourceRow[SourceImages.id]!!
                val sourceTags = data.db.from(SourceTags).innerJoin(SourceTagRelations, (SourceTags.id eq SourceTagRelations.tagId) and (SourceTagRelations.sourceId eq sourceRowId))
                    .select()
                    .map { SourceTags.createEntity(it) }
                    .map { SourceTagDto(it.name, it.displayName, it.type) }


                val relation = sourceRow[SourceImages.relations]
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    sourceRow[SourceImages.title], sourceRow[SourceImages.description], sourceTags,
                    relation?.pools ?: emptyList(), relation?.children ?: emptyList(), relation?.parents ?: emptyList())
            }else{
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    null, null, emptyList(), emptyList(), emptyList(), emptyList())
            }
        }else{
            IllustImageOriginRes(null, null, null, null, null, null, null, null, null, null)
        }
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
                        if(getInt("count") > 0) getDouble("score").roundToInt() else null
                    }
            }

            val newDescription = form.description.letOpt { it ?: "" }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                //对meta做partial update计算
                kit.processAllMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromChildren = true)
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
                val children = data.db.from(Illusts).select(Illusts.id).where { Illusts.parentId eq id }.map { it[Illusts.id]!! }
                illustMetaExporter.appendNewTask(children.map { ImageExporterTask(it,
                    exportScore = form.score.isPresent,
                    exportDescription = form.description.isPresent,
                    exportMeta = anyOpt(form.tags, form.topics, form.authors)) })
            }
        }
    }

    fun updateCollectionRelatedItems(id: Int, form: IllustCollectionRelatedUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.COLLECTION) } ?: throw NotFound()

            form.associateId.alsoOpt { newAssociateId ->
                if(illust.associateId != newAssociateId) {
                    associateManager.changeAssociate(illust, newAssociateId)
                }
            }
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
                set(it.cachedChildrenCount, images.size)
                set(it.exportedScore, illust.score ?: scoreFromSub)
                set(it.partitionTime, partitionTime)
                set(it.orderTime, orderTime)
                set(it.updateTime, now)
            }

            illustManager.processSubImages(images, id, illust.description, illust.score)
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
            val newExportedDescription = newDescription.letOpt { it.ifEmpty { parent?.description ?: "" } }

            form.partitionTime.alsoOpt {
                if(illust.partitionTime != it) partitionManager.updateItemPartition(illust.partitionTime, it)
            }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                //对meta做partial update计算
                kit.processAllMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromParent = illust.parentId)
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
                    form.orderTime.applyOpt { set(it.orderTime, this.toMillisecond()) }
                }
            }

            if(illust.parentId != null) {
                val exportScore = form.score.isPresent && parent!!.score == null
                val exportMeta = anyOpt(form.tags, form.authors, form.topics) && !kit.anyNotExportedMeta(illust.parentId)
                if(exportScore || exportMeta) {
                    //设置了score，且parent未设置score时
                    //或tags/topics/authors存在更改，且parent不存在任何not exported meta tag时
                    //将parent加入更新
                    illustMetaExporter.appendNewTask(CollectionExporterTask(illust.parentId, exportScore = exportScore, exportMeta = exportMeta))
                }
            }

        }
    }

    fun updateImageRelatedItems(id: Int, form: IllustImageRelatedUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.IMAGE) } ?: throw NotFound()

            form.associateId.alsoOpt { newAssociateId ->
                if(illust.associateId != newAssociateId) {
                    associateManager.changeAssociate(illust, newAssociateId)
                }
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
                        illustManager.processAddItemToCollection(newParent.id, illust, now)
                    }
                    if(illust.parentId != null) {
                        //处理旧parent
                        illustManager.processRemoveItemFromCollection(illust.parentId, illust, now)
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
                val (newSourceImageId, newSource, newSourceId) = sourceManager.createOrUpdateSourceImage(
                    form.source.unwrapOr { source }, form.sourceId.unwrapOr { sourceId }, form.sourcePart.unwrapOr { sourcePart },
                    form.title, form.description, form.tags, form.pools, form.children, form.parents)
                data.db.update(Illusts) {
                    where { it.id eq id }
                    set(it.sourceImageId, newSourceImageId)
                    set(it.source, newSource)
                    set(it.sourceId, newSourceId)
                    set(it.sourcePart, sourcePart)
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

            val anyNotExportedMeta = type == Illust.IllustType.COLLECTION && kit.anyNotExportedMeta(id)

            data.db.delete(Illusts) { it.id eq id }
            data.db.delete(IllustTagRelations) { it.illustId eq id }
            data.db.delete(IllustAuthorRelations) { it.illustId eq id }
            data.db.delete(IllustTopicRelations) { it.illustId eq id }
            data.db.delete(IllustAnnotationRelations) { it.illustId eq id }

            //移除illust时，执行「从associate移除一个项目」的检查流程，修改并检查引用计数
            associateManager.removeFromAssociate(illust)

            if(type == Illust.IllustType.IMAGE) {
                albumManager.removeItemInAllAlbums(id)
                folderManager.removeItemInAllFolders(id)
                //关联的partition的计数-1
                partitionManager.deleteItemInPartition(illust.partitionTime)
                //存在parent时，执行parent重导出处理。
                if(illust.parentId != null) illustManager.processRemoveItemFromCollection(illust.parentId, illust)
                //删除关联的file。无法撤销的删除放到最后，这样不必回滚
                fileManager.trashFile(illust.fileId)
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
                illustMetaExporter.appendNewTask(children.map { ImageExporterTask(it,
                    exportDescription = illust.description.isNotEmpty(),
                    exportScore = illust.score != null,
                    exportMeta = anyNotExportedMeta) })
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