package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.components.manager.PartitionManager
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.IllustAuthorRelations
import com.heerkirov.hedge.server.dao.illust.IllustTagRelations
import com.heerkirov.hedge.server.dao.illust.IllustTopicRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.tools.*
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.QueryResult
import com.heerkirov.hedge.server.utils.types.toListResult
import com.heerkirov.hedge.server.utils.types.toQueryResult
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.expression.BinaryExpression

class IllustService(private val data: DataRepository,
                    private val kit: IllustKit,
                    private val partitionManager: PartitionManager) {
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
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
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
                val (file, thumbnailFile) = takeAllFilepath(it)
                IllustRes(id, type, file, thumbnailFile, score, favorite, tagme)
            }
    }

    fun get(id: Int, type: Illust.IllustType): IllustDetailRes {
        val row = data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(FileRecords.id, FileRecords.folder, FileRecords.extension,
                Illusts.exportedDescription, Illusts.exportedScore, Illusts.favorite, Illusts.tagme,
                Illusts.partitionTime, Illusts.orderTime, Illusts.createTime, Illusts.updateTime)
            .where { retrieveCondition(id, type) }
            .firstOrNull()
            ?: throw NotFound()

        val fileId = row[FileRecords.id]!!
        val file = takeFilepath(row)

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
            .select(Topics.id, Topics.name)
            .where { IllustTopicRelations.illustId eq id }
            .map { TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!) }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name)
            .where { IllustAuthorRelations.illustId eq id }
            .map { AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!) }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color)
            .where { IllustTagRelations.illustId eq id }
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color]) }

        return IllustDetailRes(
            id, fileId, file,
            topics, authors, tags,
            description, score, favorite, tagme,
            partitionTime, orderTime, createTime, updateTime
        )
    }

    fun getCollectionRelatedItems(id: Int): IllustCollectionRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.exportedRelations)
            .where { retrieveCondition(id, Illust.IllustType.COLLECTION) }
            .firstOrNull()
            ?: throw NotFound()

        val relationIds = row[Illusts.exportedRelations]
        val relationMap = if(relationIds.isNullOrEmpty()) emptyMap() else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension)
            .where { Illusts.id inList relationIds }
            .asSequence()
            .map {
                val subId = it[Illusts.id]!!
                val thumbnailFile = takeThumbnailFilepath(it)
                Pair(subId, IllustSimpleRes(subId, thumbnailFile))
            }
            .toMap()

        return IllustCollectionRelatedRes(relations = relationIds?.map { relationMap[it]!! } ?: emptyList())
    }

    fun getCollectionImages(id: Int, filter: LimitAndOffsetFilter): ListResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { (Illusts.parentId eq id) and (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
            .limit(filter.offset, filter.limit)
            .orderBy(Illusts.orderTime.asc())
            .toListResult {
                val itemId = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val (file, thumbnailFile) = takeAllFilepath(it)
                IllustRes(itemId, type, file, thumbnailFile, score, favorite, tagme)
            }
    }

    fun getImageRelatedItems(id: Int): IllustImageRelatedRes {
        val row = data.db.from(Illusts)
            .select(Illusts.exportedRelations, Illusts.parentId)
            .where { retrieveCondition(id, Illust.IllustType.IMAGE) }
            .firstOrNull()
            ?: throw NotFound()
        val relationIds = row[Illusts.exportedRelations]
        val parentId = row[Illusts.parentId]

        val relationMap = if(relationIds.isNullOrEmpty()) emptyMap() else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension)
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
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension)
            .where { Illusts.id eq parentId }
            .firstOrNull()
            ?.let { IllustSimpleRes(it[Illusts.id]!!, takeThumbnailFilepath(it)) }

        val albums = data.db.from(Albums)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
            .select(Albums.id, Albums.title)
            .where { AlbumImageRelations.imageId eq id }
            .map { AlbumSimpleRes(it[Albums.id]!!, it[Albums.title]!!) }

        return IllustImageRelatedRes(parent, relations, albums)
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
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    sourceRow[SourceImages.title], sourceRow[SourceImages.description], sourceRow[SourceImages.tags] ?: emptyList(),
                    relation?.pools ?: emptyList(), relation?.children ?: emptyList(), relation?.parents ?: emptyList())
            }else{
                IllustImageOriginRes(source, sourceTitle ?: source, sourceId, sourcePart,
                    null, null, emptyList(), emptyList(), emptyList(), emptyList())
            }
        }
        return IllustImageOriginRes(null, null, null, null, null, null, null, null, null, null)
    }

    fun delete(id: Int, type: Illust.IllustType) {
        TODO()
    }

    fun createCollection(form: IllustCollectionCreateForm): Int {
        TODO()
    }

    fun updateCollection(id: Int, form: IllustCollectionUpdateForm) {
        TODO()
    }

    fun updateCollectionRelatedItems(id: Int, form: IllustCollectionRelatedUpdateForm) {
        TODO()
    }

    fun updateCollectionImages(id: Int, images: List<Int>) {
        TODO()
    }

    fun updateImage(id: Int, form: IllustImageUpdateForm) {
        TODO()
    }

    fun updateImageRelatedItems(id: Int, form: IllustImageRelatedUpdateForm) {
        TODO()
    }

    fun updateImageOriginData(id: Int, form: IllustImageOriginUpdateForm) {
        TODO()
    }

    private fun retrieveCondition(id: Int, type: Illust.IllustType): BinaryExpression<Boolean> {
        return (Illusts.id eq id) and if(type == Illust.IllustType.COLLECTION) {
            Illusts.type eq Illust.Type.COLLECTION
        }else{
            (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) or (Illusts.type eq Illust.Type.IMAGE)
        }
    }
}