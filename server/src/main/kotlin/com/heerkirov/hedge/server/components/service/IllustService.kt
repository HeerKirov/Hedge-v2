package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.exporter.AlbumMetadataExporterTask
import com.heerkirov.hedge.server.components.backend.exporter.BackendExporter
import com.heerkirov.hedge.server.components.backend.exporter.ExporterTask
import com.heerkirov.hedge.server.components.backend.exporter.IllustMetadataExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.components.manager.*
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.collection.FolderImageRelations
import com.heerkirov.hedge.server.dao.collection.Folders
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.dao.source.*
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.business.*
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toMillisecond
import com.heerkirov.hedge.server.utils.filterInto
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.*
import org.ktorm.expression.BinaryExpression
import kotlin.math.roundToInt

class IllustService(private val data: DataRepository,
                    private val kit: IllustKit,
                    private val illustManager: IllustManager,
                    private val illustExtendManager: IllustExtendManager,
                    private val albumManager: AlbumManager,
                    private val associateManager: AssociateManager,
                    private val folderManager: FolderManager,
                    private val fileManager: FileManager,
                    private val sourceManager: SourceImageManager,
                    private val partitionManager: PartitionManager,
                    private val queryManager: QueryManager,
                    private val backendExporter: BackendExporter) {
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
                Illusts.source, Illusts.sourceId, Illusts.sourcePart,
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
                val source = it[Illusts.source]
                val sourceId = it[Illusts.sourceId]
                val sourcePart = it[Illusts.sourcePart]
                IllustRes(id, type, childrenCount, file, thumbnailFile, score, favorite, tagme, source, sourceId, sourcePart, orderTime)
            }
    }

    fun findByIds(imageIds: List<Int>): List<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime, Illusts.cachedChildrenCount,
                Illusts.source, Illusts.sourceId, Illusts.sourcePart,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.id inList imageIds }
            .map {
                val id = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val source = it[Illusts.source]
                val sourceId = it[Illusts.sourceId]
                val sourcePart = it[Illusts.sourcePart]
                val (file, thumbnailFile) = takeAllFilepath(it)
                val childrenCount = it[Illusts.cachedChildrenCount]!!.takeIf { type == Illust.IllustType.COLLECTION }
                id to IllustRes(id, type, childrenCount, file, thumbnailFile, score, favorite, tagme, source, sourceId, sourcePart, orderTime)
            }
            .toMap()
            .let { r -> imageIds.mapNotNull { r[it] } }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int, type: Illust.IllustType? = null): IllustDetailRes {
        val row = data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status,
                Illusts.type, Illusts.cachedChildrenCount, Illusts.description, Illusts.score,
                Illusts.exportedDescription, Illusts.exportedScore, Illusts.favorite, Illusts.tagme,
                Illusts.source, Illusts.sourceId, Illusts.sourcePart,
                Illusts.partitionTime, Illusts.orderTime, Illusts.createTime, Illusts.updateTime)
            .where { retrieveCondition(id, type) }
            .firstOrNull()
            ?: throw be(NotFound())

        val (file, thumbnailFile) = takeAllFilepath(row)
        val finalType = type ?: if(row[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
        val childrenCount = row[Illusts.cachedChildrenCount]!!.takeIf { finalType == Illust.IllustType.COLLECTION }
        val originDescription = row[Illusts.description]!!
        val originScore = row[Illusts.score]
        val description = row[Illusts.exportedDescription]!!
        val score = row[Illusts.exportedScore]
        val favorite = row[Illusts.favorite]!!
        val tagme = row[Illusts.tagme]!!
        val source = row[Illusts.source]
        val sourceId = row[Illusts.sourceId]
        val sourcePart = row[Illusts.sourcePart]
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
            id, finalType, childrenCount,
            file, thumbnailFile,
            topics, authors, tags,
            description, score, favorite, tagme,
            originDescription, originScore,
            source, sourceId, sourcePart,
            partitionTime, orderTime, createTime, updateTime
        )
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("topics", number[]) 部分topics资源不存在。给出不存在的topic id列表
     * @throws ResourceNotExist ("authors", number[]) 部分authors资源不存在。给出不存在的author id列表
     * @throws ResourceNotExist ("tags", number[]) 部分tags资源不存在。给出不存在的tag id列表
     * @throws ResourceNotSuitable ("tags", number[]) 部分tags资源不适用。地址段不适用于此项。给出不适用的tag id列表
     * @throws ConflictingGroupMembersError 发现标签冲突组
     */
    fun update(id: Int, form: IllustImageUpdateForm) {
        val illust = data.db.sequenceOf(Illusts).firstOrNull { Illusts.id eq id } ?: throw be(NotFound())
        if(illust.type == Illust.Type.COLLECTION) {
            updateCollection(id, form, illust)
        }else{
            updateImage(id, form, illust)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun getCollectionRelatedItems(id: Int, filter: LimitFilter): IllustCollectionRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.associateId)
            .where { retrieveCondition(id, Illust.IllustType.COLLECTION) }
            .firstOrNull()
            ?: throw be(NotFound())

        val associateId = row[Illusts.associateId]

        val associate = associateManager.query(associateId, filter.limit)

        return IllustCollectionRelatedRes(associate)
    }

    fun getCollectionImages(id: Int, filter: LimitAndOffsetFilter): ListResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                Illusts.source, Illusts.sourceId, Illusts.sourcePart,
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
                val source = it[Illusts.source]
                val sourceId = it[Illusts.sourceId]
                val sourcePart = it[Illusts.sourcePart]
                IllustRes(itemId, type, null, file, thumbnailFile, score, favorite, tagme, source, sourceId, sourcePart, orderTime)
            }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun getImageRelatedItems(id: Int, filter: LimitFilter): IllustImageRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.associateId, Illusts.parentId)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw be(NotFound())
        val parentId = row[Illusts.parentId]
        val associateId = row[Illusts.associateId]

        val parent = if(parentId == null) null else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, Illusts.cachedChildrenCount, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.id eq parentId }
            .firstOrNull()
            ?.let { IllustParent(it[Illusts.id]!!, takeThumbnailFilepath(it), it[Illusts.cachedChildrenCount]!!) }

        val albums = data.db.from(Albums)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
            .select(Albums.id, Albums.title)
            .where { AlbumImageRelations.imageId eq id }
            .map { AlbumSimpleRes(it[Albums.id]!!, it[Albums.title]!!) }

        val folders = data.db.from(Folders)
            .innerJoin(FolderImageRelations, FolderImageRelations.folderId eq Folders.id)
            .select(Folders.id, Folders.title, Folders.parentAddress, Folders.type)
            .where { FolderImageRelations.imageId eq id }
            .map { FolderSimpleRes(it[Folders.id]!!, (it[Folders.parentAddress] ?: emptyList()) + it[Folders.title]!!, it[Folders.type]!!) }

        val associate = associateManager.query(associateId, filter.limit)

        return IllustImageRelatedRes(parent, albums, folders, associate)
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun getImageOriginData(id: Int): IllustImageOriginRes {
        val row = data.db.from(Illusts)
            .select(Illusts.source, Illusts.sourceId, Illusts.sourcePart)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw be(NotFound())

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
                val sourceTags = data.db.from(SourceTags)
                    .innerJoin(SourceTagRelations, (SourceTags.id eq SourceTagRelations.tagId) and (SourceTagRelations.sourceId eq sourceRowId))
                    .select()
                    .map { SourceTags.createEntity(it) }
                    .map { SourceTagDto(it.name, it.displayName, it.type) }
                val sourcePools = data.db.from(SourcePools)
                    .innerJoin(SourcePoolRelations, (SourcePools.id eq SourcePoolRelations.poolId) and (SourcePoolRelations.sourceId eq sourceRowId))
                    .select()
                    .map { SourcePools.createEntity(it) }
                    .map { SourcePoolDto(it.key, it.title) }

                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    sourceRow[SourceImages.empty]!!, sourceRow[SourceImages.status]!!,
                    sourceRow[SourceImages.title] ?: "", sourceRow[SourceImages.description] ?: "",
                    sourceTags, sourcePools,
                    sourceRow[SourceImages.relations] ?: emptyList())
            }else{
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    true, SourceImage.Status.NOT_EDITED, "", "", emptyList(), emptyList(), emptyList())
            }
        }else{
            IllustImageOriginRes(null, null, null, null, true, SourceImage.Status.NOT_EDITED, null, null, null, null, null)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun getImageFileInfo(id: Int): IllustImageFileInfoRes {
        val row = data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(FileRecords.columns)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw be(NotFound())

        val file = takeFilepath(row)
        val fileRecord = FileRecords.createEntity(row)

        return IllustImageFileInfoRes(file, fileRecord.extension,
            fileRecord.size, fileRecord.thumbnailSize.takeIf { it > 0 },
            fileRecord.resolutionWidth, fileRecord.resolutionHeight,
            fileRecord.createTime)
    }

    /**
     * @throws ResourceNotExist ("images", number[]) 给出的部分images不存在。给出不存在的image id列表
     */
    fun createCollection(form: IllustCollectionCreateForm): Int {
        if(form.score != null) kit.validateScore(form.score)
        data.db.transaction {
            return illustManager.newCollection(form.images, form.description ?: "", form.score, form.favorite, form.tagme)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("topics", number[]) 部分topics资源不存在。给出不存在的topic id列表
     * @throws ResourceNotExist ("authors", number[]) 部分authors资源不存在。给出不存在的author id列表
     * @throws ResourceNotExist ("tags", number[]) 部分tags资源不存在。给出不存在的tag id列表
     * @throws ResourceNotSuitable ("tags", number[]) 部分tags资源不适用。地址段不适用于此项。给出不适用的tag id列表
     * @throws ConflictingGroupMembersError 发现标签冲突组
     */
    fun updateCollection(id: Int, form: IllustCollectionUpdateForm, preIllust: Illust? = null) {
        data.db.transaction {
            val illust = preIllust ?: data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.COLLECTION) } ?: throw be(NotFound())

            form.score.alsoOpt { if(it != null) kit.validateScore(it) }

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
                kit.updateMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromChildren = true)
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
                backendExporter.add(children.map { IllustMetadataExporterTask(it,
                    exportScore = form.score.isPresent,
                    exportDescription = form.description.isPresent,
                    exportMetaTag = anyOpt(form.tags, form.topics, form.authors)) })
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("associateId", number) 新id指定的associate不存在。给出id
     */
    fun updateCollectionRelatedItems(id: Int, form: IllustCollectionRelatedUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.COLLECTION) } ?: throw be(NotFound())

            form.associateId.alsoOpt { newAssociateId ->
                if(illust.associateId != newAssociateId) {
                    associateManager.changeAssociate(illust, newAssociateId)
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("images", number[]) 给出的部分images不存在。给出不存在的image id列表
     */
    fun updateCollectionImages(id: Int, imageIds: List<Int>) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).filter { retrieveCondition(id, Illust.IllustType.COLLECTION) }.firstOrNull() ?: throw be(NotFound())

            val images = illustManager.unfoldImages(imageIds, sorted = false)
            val (fileId, scoreFromSub, partitionTime, orderTime) = kit.getExportedPropsFromList(images)

            data.db.update(Illusts) {
                where { it.id eq id }
                set(it.fileId, fileId)
                set(it.cachedChildrenCount, images.size)
                set(it.exportedScore, illust.score ?: scoreFromSub)
                set(it.partitionTime, partitionTime)
                set(it.orderTime, orderTime)
                set(it.updateTime, DateTime.now())
            }

            illustManager.updateSubImages(id, images)

            kit.refreshAllMeta(id, copyFromChildren = true)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("topics", number[]) 部分topics资源不存在。给出不存在的topic id列表
     * @throws ResourceNotExist ("authors", number[]) 部分authors资源不存在。给出不存在的author id列表
     * @throws ResourceNotExist ("tags", number[]) 部分tags资源不存在。给出不存在的tag id列表
     * @throws ResourceNotSuitable ("tags", number[]) 部分tags资源不适用。地址段不适用于此项。给出不适用的tag id列表
     * @throws ConflictingGroupMembersError 发现标签冲突组
     */
    fun updateImage(id: Int, form: IllustImageUpdateForm, preIllust: Illust? = null) {
        data.db.transaction {
            val illust = preIllust ?: data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.IMAGE) } ?: throw be(NotFound())
            val parent by lazy { if(illust.parentId == null) null else
                data.db.sequenceOf(Illusts).first { (Illusts.type eq Illust.Type.COLLECTION) and (Illusts.id eq illust.parentId) }
            }

            form.score.alsoOpt { if(it != null) kit.validateScore(it) }
            //处理属性导出
            val newDescription = form.description.letOpt { it ?: "" }
            val newExportedDescription = newDescription.letOpt { it.ifEmpty { parent?.description ?: "" } }
            val newExportedScore = form.score.letOpt { it ?: parent?.score }
            //处理metaTag导出
            if(anyOpt(form.tags, form.authors, form.topics)) {
                kit.updateMeta(id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromParent = illust.parentId)
            }
            //处理tagme变化
            val newTagme = if(form.tagme.isPresent) form.tagme else if(data.metadata.meta.autoCleanTagme && anyOpt(form.tags, form.authors, form.topics)) {
                Opt(illust.tagme
                    .runIf(form.tags.isPresent) { this - Illust.Tagme.TAG }
                    .runIf(form.authors.isPresent) { this - Illust.Tagme.AUTHOR }
                    .runIf(form.topics.isPresent) { this - Illust.Tagme.TOPIC }
                )
            }else undefined()
            //处理partition变化
            form.partitionTime.alsoOpt {
                if(illust.partitionTime != it) partitionManager.updateItemPartition(illust.partitionTime, it)
            }
            //主体属性更新
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

            //触发parent的exporter task
            if(illust.parentId != null) {
                //当更改了score，且parent的score未设置时，重新导出score
                val exportScore = form.score.isPresent && parent!!.score == null
                //当更改了metaTag，且parent不存在任何notExported metaTag时，重新导出metaTag
                val exportMeta = anyOpt(form.tags, form.authors, form.topics) && !kit.anyNotExportedMetaExists(illust.parentId)
                //当改变了time，且parent的first child就是自己时，重新导出first cover
                val exportFirstCover = anyOpt(form.orderTime, form.partitionTime) && kit.getFirstChildOfCollection(illust.parentId).id == id
                //添加task
                if(exportScore || exportMeta || exportFirstCover) {
                    backendExporter.add(IllustMetadataExporterTask(illust.parentId, exportScore = exportScore, exportMetaTag = exportMeta, exportFirstCover = exportFirstCover))
                }
            }

            //触发album的exporter task
            val albumIds = data.db.from(Albums)
                .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
                .select(Albums.id)
                .where { AlbumImageRelations.imageId eq id }
                .map { it[Albums.id]!! }
            if(albumIds.isNotEmpty()) {
                val exportMeta = anyOpt(form.tags, form.authors, form.topics)
                if(exportMeta) {
                    for (albumId in albumIds) {
                        backendExporter.add(AlbumMetadataExporterTask(albumId, exportMetaTag = true))
                    }
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("collectionId", number) 新id指定的parent不存在。给出collection id
     * @throws ResourceNotExist ("associateId", number) 新id指定的associate不存在。给出id
     */
    fun updateImageRelatedItems(id: Int, form: IllustImageRelatedUpdateForm) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { retrieveCondition(id, Illust.IllustType.IMAGE) } ?: throw be(NotFound())

            form.associateId.alsoOpt { newAssociateId ->
                if(illust.associateId != newAssociateId) {
                    associateManager.changeAssociate(illust, newAssociateId)
                }
            }

            form.collectionId.alsoOpt { newParentId ->
                if(illust.parentId != newParentId) {
                    val newParent = if(newParentId == null) null else {
                        data.db.sequenceOf(Illusts).firstOrNull { (it.id eq newParentId) and (it.type eq Illust.Type.COLLECTION) }
                            ?: throw be(ResourceNotExist("collectionId", newParentId))
                    }
                    //处理属性导出
                    val exportedScore = illust.score ?: newParent?.score
                    val exportedDescription = illust.description.ifEmpty { newParent?.description ?: "" }
                    val anyNotExportedMetaExists = kit.anyNotExportedMetaExists(id)
                    if(!anyNotExportedMetaExists) {
                        kit.refreshAllMeta(id, copyFromParent = newParentId)
                    }
                    //处理主体属性变化
                    data.db.update(Illusts) {
                        where { it.id eq id }
                        set(it.parentId, newParentId)
                        set(it.type, if(newParentId != null) Illust.Type.IMAGE_WITH_PARENT else Illust.Type.IMAGE)
                        set(it.exportedScore, exportedScore)
                        set(it.exportedDescription, exportedDescription)
                    }

                    //更换image的parent时，需要对三个方面重导出：image自己; 旧parent; 新parent
                    val now = DateTime.now()
                    if(newParent != null) {
                        illustManager.processCollectionChildrenAdded(newParent.id, illust, now, exportMetaTags = anyNotExportedMetaExists, exportScore = illust.score != null)
                    }
                    if(illust.parentId != null) {
                        //处理旧parent
                        illustManager.processCollectionChildrenRemoved(illust.parentId, listOf(illust), now, exportMetaTags = anyNotExportedMetaExists, exportScore = illust.score != null)
                    }
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun updateImageOriginData(id: Int, form: IllustImageOriginUpdateForm) {
        data.db.transaction {
            val row = data.db.from(Illusts).select(Illusts.source, Illusts.sourceId, Illusts.sourcePart, Illusts.tagme)
                .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
                .firstOrNull()
                ?: throw be(NotFound())
            val source = row[Illusts.source]
            val sourceId = row[Illusts.sourceId]
            val sourcePart = row[Illusts.sourcePart]
            val tagme = row[Illusts.tagme]!!
            if(form.source.isPresent || form.sourceId.isPresent || form.sourcePart.isPresent) {
                val newSourcePart = form.sourcePart.unwrapOr { sourcePart }
                val (newSourceImageId, newSource, newSourceId) = sourceManager.checkSource(form.source.unwrapOr { source }, form.sourceId.unwrapOr { sourceId }, newSourcePart)
                    ?.let { (source, sourceId) -> sourceManager.createOrUpdateSourceImage(source, sourceId, form.status, form.title, form.description, form.tags, form.pools, form.relations) }
                    ?: Triple(null, null, null)
                data.db.update(Illusts) {
                    where { it.id eq id }
                    set(it.sourceImageId, newSourceImageId)
                    set(it.source, newSource)
                    set(it.sourceId, newSourceId)
                    set(it.sourcePart, newSourcePart)
                    if(data.metadata.meta.autoCleanTagme && Illust.Tagme.SOURCE in tagme) set(it.tagme, tagme - Illust.Tagme.SOURCE)
                }
            }else{
                sourceManager.checkSource(source, sourceId, sourcePart)?.let { (source, sourceId) ->
                    sourceManager.createOrUpdateSourceImage(source, sourceId, form.status, form.title, form.description, form.tags, form.pools, form.relations)
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int, type: Illust.IllustType? = null) {
        data.db.transaction {
            val illust = data.db.from(Illusts).select()
                .where { retrieveCondition(id, type) }
                .firstOrNull()
                ?.let { Illusts.createEntity(it) }
                ?: throw be(NotFound())

            illustExtendManager.delete(illust)
        }
    }

    /**
     * 批量修改属性。
     * @throws ResourceNotExist ("target", number[]) 选取的资源不存在。
     * @throws ResourceNotSuitable ("target", number[]) 不能同时编辑collection和它下属的image。
     */
    fun batchUpdate(form: IllustBatchUpdateForm) {
        if(form.target.isEmpty()) return
        data.db.transaction {
            val records = data.db.sequenceOf(Illusts).filter { it.id inList form.target }.toList().also { records ->
                val targetSet = form.target.toSet()
                if(records.size < form.target.size) {
                    throw be(ResourceNotExist("target", targetSet - records.map { it.id }.toSet()))
                }else if(records.any { it.parentId in targetSet }) {
                    throw be(ResourceNotSuitable("target", records.filter { it.parentId in targetSet }))
                }
            }
            val (collections, images) = records.filterInto { it.type == Illust.Type.COLLECTION }
            val collectionIds by lazy { collections.map { it.id } }
            val imageIds by lazy { images.map { it.id } }
            val childrenOfCollections by lazy { if(collections.isEmpty()) emptyList() else data.db.sequenceOf(Illusts).filter { it.parentId inList collectionIds }.toList() }

            val exporterTasks = mutableListOf<ExporterTask>()

            //favorite
            form.favorite.alsoOpt { favorite ->
                data.db.update(Illusts) {
                    where { it.id inList form.target }
                    set(it.favorite, favorite)
                }
            }

            //score
            form.score.alsoOpt { score ->
                if(score != null) {
                    kit.validateScore(score)

                    //在给出score的情况下直接设定所有score
                    data.db.update(Illusts) {
                        where { it.id inList form.target }
                        set(it.score, score)
                        set(it.exportedScore, score)
                    }

                    exporterTasks.addAll(childrenOfCollections.map { IllustMetadataExporterTask(it.id, exportScore = true) })
                    exporterTasks.addAll(images.mapNotNull { it.parentId }.map { IllustMetadataExporterTask(it, exportScore = true) })
                }else{
                    //在给出null的情况下，对于所有collection,计算children的其平均值
                    val collectionScores = if(collections.isNotEmpty()) emptyMap() else data.db.from(Illusts)
                        .select(Illusts.parentId, count(Illusts.id).aliased("count"), avg(Illusts.score).aliased("score"))
                        .where { Illusts.parentId inList collectionIds }
                        .groupBy(Illusts.parentId)
                        .associate {
                            it[Illusts.parentId]!! to if(it.getInt("count") > 0) it.getDouble("score").roundToInt() else null
                        }
                    //对于所有image,获得其parent的score
                    val imageScores = if(images.isEmpty()) emptyMap() else data.db.from(Illusts)
                        .select(Illusts.id, Illusts.score)
                        .where { Illusts.id inList images.mapNotNull { it.parentId } }
                        .associate { it[Illusts.id]!! to it[Illusts.score] }
                    //然后更新到db
                    data.db.batchUpdate(Illusts) {
                        for (record in records) {
                            item {
                                where { it.id eq record.id }
                                set(it.score, null)
                                set(it.exportedScore, if(record.type == Illust.Type.COLLECTION) {
                                    collectionScores[record.id]
                                }else{
                                    imageScores[record.parentId]
                                })
                            }
                        }
                    }

                    exporterTasks.addAll(childrenOfCollections.map { IllustMetadataExporterTask(it.id, exportScore = true) })
                    exporterTasks.addAll(images.mapNotNull { it.parentId }.map { IllustMetadataExporterTask(it, exportScore = true) })
                }
            }

            //description
            form.description.alsoOpt { description ->
                if(!description.isNullOrEmpty()) {
                    //在给出description的情况下直接设定所有description
                    data.db.update(Illusts) {
                        where { it.id inList form.target }
                        set(it.description, description)
                        set(it.exportedDescription, description)
                    }

                    if(childrenOfCollections.isNotEmpty()) {
                        exporterTasks.addAll(childrenOfCollections.map { IllustMetadataExporterTask(it.id, exportDescription = true) })
                    }
                }else{
                    //在给出empty的情况下，对于所有collection仍直接设定；对于image,需要获得其parent的description
                    if(collections.isNotEmpty()) {
                        data.db.update(Illusts) {
                            where { it.id inList collectionIds }
                            set(it.description, "")
                            set(it.exportedDescription, "")
                        }

                        if(childrenOfCollections.isNotEmpty()) {
                            exporterTasks.addAll(childrenOfCollections.map { IllustMetadataExporterTask(it.id, exportDescription = true) })
                        }
                    }
                    if(images.isNotEmpty()) {
                        val imageDescriptions = data.db.from(Illusts)
                            .select(Illusts.id, Illusts.description)
                            .where { Illusts.id inList images.mapNotNull { it.parentId } }
                            .associate { it[Illusts.id]!! to it[Illusts.description]!! }
                        data.db.batchUpdate(Illusts) {
                            for (record in images) {
                                item {
                                    where { it.id eq record.id }
                                    set(it.description, "")
                                    set(it.exportedDescription, imageDescriptions[record.parentId] ?: "")
                                }
                            }
                        }
                    }
                }
            }

            //meta tag
            if(anyOpt(form.tags, form.topics, form.authors)) {
                //由于meta tag的更新实在复杂，不必在这里搞batch优化了，就挨个处理就好了
                for (illust in images) {
                    kit.updateMeta(illust.id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromParent = illust.parentId)

                    if(illust.parentId != null && !kit.anyNotExportedMetaExists(illust.parentId)) {
                        exporterTasks.add(IllustMetadataExporterTask(illust.parentId, exportMetaTag = true))
                    }
                    data.db.from(Albums)
                        .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id).select(Albums.id)
                        .where { AlbumImageRelations.imageId inList imageIds }.groupBy(Albums.id)
                        .forEach { exporterTasks.add(AlbumMetadataExporterTask(it[Albums.id]!!, exportMetaTag = true)) }
                }
                for (illust in collections) {
                    kit.updateMeta(illust.id, newTags = form.tags, newAuthors = form.authors, newTopics = form.topics, copyFromChildren = true)

                    data.db.from(Illusts).select(Illusts.id)
                        .where { Illusts.parentId inList collectionIds }
                        .groupBy(Illusts.id)
                        .forEach { exporterTasks.add(IllustMetadataExporterTask(it[Illusts.id]!!, exportMetaTag = true)) }
                }
            }

            //tagme
            if(form.tagme.isPresent) {
                data.db.update(Illusts) {
                    where { it.id inList form.target }
                    set(it.tagme, form.tagme.value)
                }
            }else if(data.metadata.meta.autoCleanTagme && anyOpt(form.tags, form.authors, form.topics)) {
                data.db.batchUpdate(Illusts) {
                    for (record in records) {
                       item {
                           where { it.id eq record.id }
                           set(it.tagme, record.tagme
                               .runIf(form.tags.isPresent) { this - Illust.Tagme.TAG }
                               .runIf(form.authors.isPresent) { this - Illust.Tagme.AUTHOR }
                               .runIf(form.topics.isPresent) { this - Illust.Tagme.TOPIC })
                       }
                    }
                }
            }

            //partition time
            form.partitionTime.alsoOpt { partitionTime ->
                //tips: 绕过标准导出流程进行更改。对于collection,直接修改它及它全部children的此属性
                val children = childrenOfCollections.filter { it.partitionTime != partitionTime }.map { Pair(it.id, it.partitionTime) }

                data.db.update(Illusts) {
                    where { it.id inList (children.map { (id, _) -> id } + form.target) }
                    set(it.partitionTime, partitionTime)
                }

                for ((_, oldPartitionTime) in children) {
                   partitionManager.updateItemPartition(oldPartitionTime, partitionTime)
                }
                for (illust in images) {
                   if(illust.partitionTime != partitionTime) {
                       partitionManager.updateItemPartition(illust.partitionTime, partitionTime)
                   }
                }
            }

            //order time
            form.orderTimeBegin.alsoOpt { orderTimeBegin ->
                //找出所有image及collection的children，按照原有orderTime顺序排序，并依次计算新orderTime。排序时相同parent的children保持相邻
                //对于collection，绕过标准导出流程进行更改。直接按照计算结果修改collection的orderTime，且无需导出，因为orderTime并未变化
                val children = childrenOfCollections.map { Triple(it.id, it.parentId!!, it.orderTime) }

                val seq = records.asSequence()
                    .sortedBy { it.orderTime }
                    .flatMap {
                        if(it.type == Illust.Type.COLLECTION) {
                            children.filter { (_, parentId, _) -> parentId == it.id }.asSequence().sortedBy { (_, _, t) -> t }
                        }else{
                            sequenceOf(Triple(it.id, null, it.orderTime))
                        }
                    }
                    .toList()

                val values = if(seq.size > 1) {
                    val beginMs = orderTimeBegin.toMillisecond()
                    val endMs = form.orderTimeEnd.letOpt {
                        it.toMillisecond().apply {
                            if(it < orderTimeBegin) {
                                throw be(ParamError("orderTimeEnd"))
                            }
                        }
                    }.unwrapOr {
                        //若未给出endTime，则尝试如下策略：
                        //如果beginTime距离now很近(每个项的空间<2s)，那么将now作为endTime
                        //但如果beginTime过近(每个项空间<10ms)，或超过了now，或距离过远，那么以1s为单位间隔生成endTime
                        val nowMs = DateTime.now().toMillisecond()
                        if(nowMs < beginMs + (seq.size - 1) * 2000 && nowMs > beginMs + (seq.size - 1) * 10) {
                            nowMs
                        }else{
                            beginMs + (seq.size - 1) * 1000
                        }
                    }
                    val step = (endMs - beginMs) / (seq.size - 1)
                    var value = beginMs
                    seq.indices.map {
                        value.also {
                            value += step
                        }
                    }
                }else{
                    listOf(orderTimeBegin.toMillisecond())
                }

                data.db.batchUpdate(Illusts) {
                    seq.forEachIndexed { i, (id, _, _) ->
                        item {
                            where { it.id eq id }
                            set(it.orderTime, values[i])
                        }
                    }
                }

                if(collections.isNotEmpty()) {
                    val collectionValues = seq.filter { (_, p, _) -> p != null }
                        .zip(values) { (id, p, _), ot -> Triple(id, p!!, ot) }
                        .groupBy { (_, p, _) -> p }
                        .mapValues { (_, values) -> values.minOf { (_, _, t) -> t } }

                    data.db.batchUpdate(Illusts) {
                        for ((id, ot) in collectionValues) {
                            item {
                                where { it.id eq id }
                                set(it.orderTime, ot)
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 克隆图像的属性。
     * @throws ResourceNotExist ("from" | "to", number) 源或目标不存在
     * @throws ResourceNotSuitable ("from" | "to", number) 源或目标类型不适用，不能使用集合
     */
    fun cloneImageProps(form: ImagePropsCloneForm) {
        data.db.transaction {
            val fromIllust = data.db.sequenceOf(Illusts).firstOrNull { it.id eq form.from } ?: throw be(ResourceNotExist("from", form.from))
            val toIllust = data.db.sequenceOf(Illusts).firstOrNull { it.id eq form.to } ?: throw be(ResourceNotExist("to", form.to))
            if(fromIllust.type == Illust.Type.COLLECTION) throw be(ResourceNotSuitable("from", form.from))
            if(toIllust.type == Illust.Type.COLLECTION) throw be(ResourceNotSuitable("to", form.to))

            illustExtendManager.cloneProps(fromIllust, toIllust, form.props, form.merge)

            if(form.deleteFrom) {
                delete(fromIllust.id, Illust.IllustType.IMAGE)
            }
        }
    }

    private fun retrieveCondition(id: Int, type: Illust.IllustType?): BinaryExpression<Boolean> {
        return (Illusts.id eq id).runIf(type != null) {
            this and if(type!! == Illust.IllustType.COLLECTION) {
                Illusts.type eq Illust.Type.COLLECTION
            }else{
                (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) or (Illusts.type eq Illust.Type.IMAGE)
            }
        }
    }
}