package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.components.manager.AlbumManager
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.tools.takeAllFilepath
import com.heerkirov.hedge.server.tools.takeFilepath
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.*
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf

class AlbumService(private val data: DataRepository,
                   private val kit: AlbumKit,
                   private val albumManager: AlbumManager) {
    private val orderTranslator = OrderTranslator {
        "id" to Albums.id
        "createTime" to Albums.createTime
        "updateTime" to Albums.updateTime
        "score" to Albums.score nulls last
    }

    fun list(filter: AlbumQueryFilter): QueryResult<AlbumRes> {
        return data.db.from(Albums)
            .leftJoin(FileRecords, Albums.fileId eq FileRecords.id)
            .select(Albums.id, Albums.title, Albums.cachedCount, Albums.score, Albums.favorite, Albums.createTime, Albums.updateTime,
                FileRecords.thumbnail, FileRecords.folder, FileRecords.id, FileRecords.extension)
            .whereWithConditions {
                if(filter.favorite != null) {
                    it += if(filter.favorite) Albums.favorite else Albums.favorite.not()
                }
                //TODO 实现QL查询
            }
            .limit(filter.offset, filter.limit)
            .orderBy(filter.order, orderTranslator)
            .toQueryResult(emptyList()) {
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
            return albumManager.newAlbum(form.images, form.subtitles, form.title ?: "", form.description ?: "", form.score, form.favorite)
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

        val file = takeFilepath(row)

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

            if(anyOpt(form.score, newDescription)) {
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

    fun getImages(id: Int, filter: LimitAndOffsetFilter): AlbumImageResult {
        val albumRow = data.db.from(Albums).select(Albums.subtitles).where { Albums.id eq id }.firstOrNull() ?: throw NotFound()
        val subtitles = albumRow[Albums.subtitles]?.filter { it.ordinal >= filter.offset && it.ordinal < filter.offset + filter.limit } ?: emptyList()

        val rows = data.db.from(Illusts)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.imageId eq Illusts.id)
            .select(AlbumImageRelations.ordinal, Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.thumbnail)
            .where { AlbumImageRelations.albumId eq id }
            .limit(filter.offset, filter.limit)
            .orderBy(AlbumImageRelations.ordinal.asc())

        return AlbumImageResult(rows.totalRecords, subtitles, rows.map {
            val ordinal = it[AlbumImageRelations.ordinal]!!
            val itemId = it[Illusts.id]!!
            val score = it[Illusts.exportedScore]
            val favorite = it[Illusts.favorite]!!
            val tagme = it[Illusts.tagme]!!
            val orderTime = it[Illusts.orderTime]!!.parseDateTime()
            val (file, thumbnailFile) = takeAllFilepath(it)
            AlbumImageResult.ImageItem(itemId, ordinal, file, thumbnailFile, score, favorite, tagme, orderTime)
        })
    }

    fun updateImages(id: Int, form: AlbumImageUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { Albums.id eq id } ?: throw NotFound()

            val (images, fileId) = kit.validateSubImages(form.images)
            val subtitles = kit.validateAllSubtitles(form.subtitles, images.size)
            val now = DateTime.now()

            data.db.update(Albums) {
                where { it.id eq id }
                set(it.fileId, fileId)
                set(it.cachedCount, images.size)
                set(it.subtitles, subtitles)
                set(it.updateTime, now)
            }

            kit.processSubImages(images, id)
        }
    }

    fun partialUpdateImages(id: Int, form: AlbumImagesPartialUpdateForm) {
        TODO()
    }
}