package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.components.manager.AlbumManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.album.AlbumImageRelation
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.tools.takeAllFilepath
import com.heerkirov.hedge.server.tools.takeFilepath
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class AlbumService(private val data: DataRepository,
                   private val kit: AlbumKit,
                   private val albumManager: AlbumManager,
                   private val queryManager: QueryManager) {
    private val orderTranslator = OrderTranslator {
        "id" to Albums.id
        "createTime" to Albums.createTime
        "updateTime" to Albums.updateTime
        "score" to Albums.score nulls last
    }

    fun list(filter: AlbumQueryFilter): ListResult<AlbumRes> {
        val schema = if(filter.query.isNullOrBlank()) null else {
            queryManager.querySchema(filter.query, QueryManager.Dialect.ALBUM).executePlan ?: return ListResult(0, emptyList())
        }
        return data.db.from(Albums)
            .leftJoin(FileRecords, Albums.fileId eq FileRecords.id)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .select(Albums.id, Albums.title, Albums.cachedCount, Albums.score, Albums.favorite, Albums.createTime, Albums.updateTime,
                FileRecords.thumbnail, FileRecords.folder, FileRecords.id, FileRecords.extension)
            .whereWithConditions {
                if(filter.favorite != null) {
                    it += if(filter.favorite) Albums.favorite else Albums.favorite.not()
                }
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(Albums.id) }
            .limit(filter.offset, filter.limit)
            .orderBy(orderTranslator, filter.order, schema?.orderConditions, default = descendingOrderItem("createTime"))
            .toListResult {
                val id = it[Albums.id]!!
                val title = it[Albums.title]!!
                val imageCount = it[Albums.cachedCount]!!
                val (file, thumbnailFile) = if(it[FileRecords.id] != null) takeAllFilepath(it) else null to null
                val score = it[Albums.score]
                val favorite = it[Albums.favorite]!!
                val createTime = it[Albums.createTime]!!
                val updateTime = it[Albums.updateTime]!!
                AlbumRes(id, title, imageCount, file, thumbnailFile, score, favorite, createTime, updateTime)
            }

    }

    fun create(form: AlbumCreateForm): Int {
        if(form.score != null) kit.validateScore(form.score)
        data.db.transaction {
            return albumManager.newAlbum(form.images, form.title ?: "", form.description ?: "", form.score, form.favorite)
        }
    }

    fun get(id: Int): AlbumDetailRes {
        val row = data.db.from(Albums)
            .leftJoin(FileRecords, Albums.fileId eq FileRecords.id)
            .select(Albums.id, Albums.title, Albums.description, Albums.cachedCount,
                Albums.score, Albums.favorite, Albums.createTime, Albums.updateTime,
                FileRecords.folder, FileRecords.id, FileRecords.extension)
            .where { Albums.id eq id }
            .firstOrNull()
            ?: throw NotFound()

        val file = if(row[FileRecords.id] != null) takeFilepath(row) else null

        val title = row[Albums.title]!!
        val description = row[Albums.description]!!
        val imageCount = row[Albums.cachedCount]!!
        val score = row[Albums.score]
        val favorite = row[Albums.favorite]!!
        val createTime = row[Albums.createTime]!!
        val updateTime = row[Albums.updateTime]!!

        val topics = data.db.from(Topics)
            .innerJoin(AlbumTopicRelations, AlbumTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, AlbumTopicRelations.isExported)
            .where { AlbumTopicRelations.albumId eq id }
            .map { TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, it[AlbumTopicRelations.isExported]!!) }

        val authors = data.db.from(Authors)
            .innerJoin(AlbumAuthorRelations, AlbumAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, AlbumAuthorRelations.isExported)
            .where { AlbumAuthorRelations.albumId eq id }
            .map { AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, it[AlbumAuthorRelations.isExported]!!) }

        val tags = data.db.from(Tags)
            .innerJoin(AlbumTagRelations, AlbumTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, AlbumTagRelations.isExported)
            .where { (AlbumTagRelations.albumId eq id) and (Tags.type eq Tag.Type.TAG) }
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[AlbumTagRelations.isExported]!!) }

        return AlbumDetailRes(id, title, imageCount, file, topics, authors, tags, description, score, favorite, createTime, updateTime)
    }

    fun update(id: Int, form: AlbumUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { it.id eq id } ?: throw NotFound()

            form.score.alsoOpt {
                if(it != null) kit.validateScore(it)
            }

            val newTitle = form.title.letOpt { it ?: "" }
            val newDescription = form.description.letOpt { it ?: "" }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                kit.processAllMeta(id, newTags = form.tags, newTopics = form.topics, newAuthors = form.authors)
            }

            if(anyOpt(form.score, form.favorite, newTitle, newDescription)) {
                data.db.update(Albums) {
                    where { it.id eq id }
                    form.score.applyOpt { set(it.score, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                    newTitle.applyOpt { set(it.description, this) }
                    newDescription.applyOpt { set(it.description, this) }
                }
            }
        }
    }

    fun delete(id: Int) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { it.id eq id } ?: throw NotFound()

            data.db.delete(Albums) { it.id eq id }
            data.db.delete(AlbumTagRelations) { it.albumId eq id }
            data.db.delete(AlbumTopicRelations) { it.albumId eq id }
            data.db.delete(AlbumAuthorRelations) { it.albumId eq id }
            data.db.delete(AlbumAnnotationRelations) { it.albumId eq id }
        }
    }

    fun getImages(id: Int, filter: LimitAndOffsetFilter): ListResult<AlbumImageRes> {
        return data.db.from(AlbumImageRelations)
            .leftJoin(Illusts, AlbumImageRelations.imageId eq Illusts.id)
            .leftJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(AlbumImageRelations.ordinal, Illusts.id,
                Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { AlbumImageRelations.albumId eq id }
            .limit(filter.offset, filter.limit)
            .orderBy(AlbumImageRelations.ordinal.asc())
            .toListResult {
                val ordinal = it[AlbumImageRelations.ordinal]!!
                val imageId = it[Illusts.id]!!
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                AlbumImageRes(imageId, ordinal, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    fun updateImages(id: Int, items: List<Int>) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { Albums.id eq id } ?: throw NotFound()

            val (images, imageCount, fileId) = kit.validateSubImages(items)
            val now = DateTime.now()

            data.db.update(Albums) {
                where { it.id eq id }
                set(it.fileId, fileId)
                set(it.cachedCount, imageCount)
                set(it.updateTime, now)
            }

            kit.processSubImages(images, id)
        }
    }

    fun partialUpdateImages(id: Int, form: AlbumImagesPartialUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { Albums.id eq id } ?: throw NotFound()

            when (form.action) {
                BatchAction.ADD -> {
                    val images = form.images ?: throw ParamRequired("images")
                    kit.validateSubImages(images)
                    kit.insertSubImages(images, id, form.ordinal)
                    kit.exportFileAndCount(id)
                }
                BatchAction.MOVE -> {
                    val itemIndexes = form.itemIndexes ?: throw ParamRequired("itemIndexes")
                    if(itemIndexes.isNotEmpty()) {
                        kit.moveSubImages(itemIndexes, id, form.ordinal)
                        kit.exportFileAndCount(id)
                    }
                }
                BatchAction.DELETE -> {
                    val itemIndexes = form.itemIndexes ?: throw ParamRequired("itemIndexes")
                    if(itemIndexes.isNotEmpty()) {
                        kit.deleteSubImages(itemIndexes, id)
                        kit.exportFileAndCount(id)
                    }
                }
            }
        }
    }
}