package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.components.manager.AlbumManager
import com.heerkirov.hedge.server.components.manager.IllustManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.business.takeAllFilepath
import com.heerkirov.hedge.server.utils.business.takeFilepath
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
                   private val illustManager: IllustManager,
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
                FileRecords.status, FileRecords.folder, FileRecords.id, FileRecords.extension)
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

    /**
     * @throws ResourceNotExist ("images", number[]) image项不存在。给出imageId列表
     */
    fun create(form: AlbumCreateForm): Int {
        if(form.score != null) kit.validateScore(form.score)
        data.db.transaction {
            return albumManager.newAlbum(form.images, form.title ?: "", form.description ?: "", form.score, form.favorite)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): AlbumDetailRes {
        val row = data.db.from(Albums)
            .leftJoin(FileRecords, Albums.fileId eq FileRecords.id)
            .select(Albums.id, Albums.title, Albums.description, Albums.cachedCount,
                Albums.score, Albums.favorite, Albums.createTime, Albums.updateTime,
                FileRecords.folder, FileRecords.id, FileRecords.extension)
            .where { Albums.id eq id }
            .firstOrNull()
            ?: throw be(NotFound())

        val (file, thumbnailFile) = if(row[FileRecords.id] != null) takeAllFilepath(row) else null to null

        val title = row[Albums.title]!!
        val description = row[Albums.description]!!
        val imageCount = row[Albums.cachedCount]!!
        val score = row[Albums.score]
        val favorite = row[Albums.favorite]!!
        val createTime = row[Albums.createTime]!!
        val updateTime = row[Albums.updateTime]!!

        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(AlbumTopicRelations, AlbumTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, Topics.type, AlbumTopicRelations.isExported)
            .where { AlbumTopicRelations.albumId eq id }
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[AlbumTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(AlbumAuthorRelations, AlbumAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, Authors.type, AlbumAuthorRelations.isExported)
            .where { AlbumAuthorRelations.albumId eq id }
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[AlbumAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(AlbumTagRelations, AlbumTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, AlbumTagRelations.isExported)
            .where { (AlbumTagRelations.albumId eq id) and (Tags.type eq Tag.Type.TAG) }
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[AlbumTagRelations.isExported]!!) }

        return AlbumDetailRes(id, title, imageCount, file, thumbnailFile, topics, authors, tags, description, score, favorite, createTime, updateTime)
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("topics", number[]) 部分topics资源不存在。给出不存在的topic id列表
     * @throws ResourceNotExist ("authors", number[]) 部分authors资源不存在。给出不存在的author id列表
     * @throws ResourceNotExist ("tags", number[]) 部分tags资源不存在。给出不存在的tag id列表
     * @throws ResourceNotSuitable ("tags", number[]) 部分tags资源不适用。地址段不适用于此项。给出不适用的tag id列表
     * @throws ConflictingGroupMembersError 发现标签冲突组
     */
    fun update(id: Int, form: AlbumUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { it.id eq id } ?: throw be(NotFound())

            form.score.alsoOpt { if(it != null) kit.validateScore(it) }
            val newTitle = form.title.letOpt { it ?: "" }
            val newDescription = form.description.letOpt { it ?: "" }

            if(anyOpt(form.tags, form.authors, form.topics)) {
                kit.updateMeta(id, newTags = form.tags, newTopics = form.topics, newAuthors = form.authors)
            }

            if(anyOpt(form.score, form.favorite, newTitle, newDescription)) {
                data.db.update(Albums) {
                    where { it.id eq id }
                    form.score.applyOpt { set(it.score, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                    newTitle.applyOpt { set(it.title, this) }
                    newDescription.applyOpt { set(it.description, this) }
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { it.id eq id } ?: throw be(NotFound())

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
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
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

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("images", number[]) image项不存在，给出imageId列表
     */
    fun updateImages(id: Int, items: List<Int>) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { Albums.id eq id } ?: throw be(NotFound())

            val images = illustManager.unfoldImages(items)
            val fileId = images.first().fileId

            data.db.update(Albums) {
                where { it.id eq id }
                set(it.fileId, fileId)
                set(it.cachedCount, images.size)
                set(it.updateTime, DateTime.now())
            }

            kit.updateSubImages(id, images.map { it.id })

            kit.refreshAllMeta(id)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("images", number[]) image项不存在，给出imageId列表
     * @throws ResourceNotExist ("itemIndexes", number[]) 要操作的image index不存在。给出不存在的index列表
     */
    fun partialUpdateImages(id: Int, form: AlbumImagesPartialUpdateForm) {
        data.db.transaction {
            data.db.sequenceOf(Albums).firstOrNull { Albums.id eq id } ?: throw be(NotFound())

            when (form.action) {
                BatchAction.ADD -> {
                    val formImages = form.images ?: throw be(ParamRequired("images"))
                    val images = illustManager.unfoldImages(formImages)
                    kit.insertSubImages(id, images.map { it.id }, form.ordinal)
                    kit.refreshFirstCover(id)
                    kit.refreshAllMeta(id)
                }
                BatchAction.MOVE -> {
                    val itemIndexes = form.itemIndexes ?: throw be(ParamRequired("itemIndexes"))
                    if(itemIndexes.isNotEmpty()) {
                        kit.moveSubImages(id, itemIndexes, form.ordinal)
                        kit.refreshFirstCover(id)
                        kit.refreshAllMeta(id)
                    }
                }
                BatchAction.DELETE -> {
                    val itemIndexes = form.itemIndexes ?: throw be(ParamRequired("itemIndexes"))
                    if(itemIndexes.isNotEmpty()) {
                        kit.deleteSubImages(id, itemIndexes)
                        kit.refreshFirstCover(id)
                        kit.refreshAllMeta(id)
                    }
                }
            }
        }
    }
}