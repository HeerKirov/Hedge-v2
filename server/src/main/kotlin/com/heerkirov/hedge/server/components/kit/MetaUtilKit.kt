package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.IllustAuthorRelations
import com.heerkirov.hedge.server.dao.illust.IllustTagRelations
import com.heerkirov.hedge.server.dao.illust.IllustTopicRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.model.meta.Tag
import org.ktorm.dsl.*

class MetaUtilKit(private val data: DataRepository) {
    /**
     * 获得一个collection的元数据。
     */
    fun suggestMetaOfCollection(collectionId: Int): MetaUtilSuggestionByParentCollection {
        val res = getMetaOfIllust(collectionId)
        return MetaUtilSuggestionByParentCollection(collectionId, res.topics, res.authors, res.tags)
    }

    /**
     * 获得一个collection的所有下属image的元数据。
     */
    fun suggestMetaOfCollectionChildren(collectionId: Int): MetaUtilSuggestionByChildren {
        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .innerJoin(Illusts, Illusts.id eq IllustTopicRelations.illustId)
            .select(Topics.id, Topics.name, Topics.type, IllustTopicRelations.isExported)
            .where { Illusts.parentId eq collectionId }
            .groupBy(Topics.id)
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[IllustTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .innerJoin(Illusts, Illusts.id eq IllustAuthorRelations.illustId)
            .select(Authors.id, Authors.name, Authors.type, IllustAuthorRelations.isExported)
            .where { Illusts.parentId eq collectionId }
            .groupBy(Authors.id)
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[IllustAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .innerJoin(Illusts, Illusts.id eq IllustTagRelations.illustId)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (Illusts.parentId eq collectionId) and (Tags.type eq Tag.Type.TAG) }
            .groupBy(Tags.id)
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return MetaUtilSuggestionByChildren(topics, authors, tags)
    }

    /**
     * 获得一个album的下属所有image的元数据。
     */
    fun suggestMetaOfAlbumChildren(albumId: Int): MetaUtilSuggestionByChildren {
        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.imageId eq IllustTopicRelations.illustId)
            .select(Topics.id, Topics.name, Topics.type, IllustTopicRelations.isExported)
            .where { AlbumImageRelations.albumId eq albumId }
            .groupBy(Topics.id)
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[IllustTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.imageId eq IllustAuthorRelations.illustId)
            .select(Authors.id, Authors.name, Authors.type, IllustAuthorRelations.isExported)
            .where { AlbumImageRelations.albumId eq albumId }
            .groupBy(Authors.id)
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[IllustAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.imageId eq IllustTagRelations.illustId)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (AlbumImageRelations.albumId eq albumId) and (Tags.type eq Tag.Type.TAG) }
            .groupBy(Tags.id)
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return MetaUtilSuggestionByChildren(topics, authors, tags)
    }

    /**
     * 获得一个associate下所有illust的元数据。
     */
    fun suggestMetaOfAssociate(associateId: Int): MetaUtilSuggestionByAssociate {
        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .innerJoin(Illusts, Illusts.id eq IllustTopicRelations.illustId)
            .select(Topics.id, Topics.name, Topics.type, IllustTopicRelations.isExported)
            .where { Illusts.associateId eq associateId }
            .groupBy(Topics.id)
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[IllustTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .innerJoin(Illusts, Illusts.id eq IllustAuthorRelations.illustId)
            .select(Authors.id, Authors.name, Authors.type, IllustAuthorRelations.isExported)
            .where { Illusts.associateId eq associateId }
            .groupBy(Authors.id)
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[IllustAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .innerJoin(Illusts, Illusts.id eq IllustTagRelations.illustId)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (Illusts.associateId eq associateId) and (Tags.type eq Tag.Type.TAG) }
            .groupBy(Tags.id)
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return MetaUtilSuggestionByAssociate(topics, authors, tags)
    }

    /**
     * 获得关联的所有album的元数据。
     */
    fun suggestMetaOfAlbum(imageId: Int): List<MetaUtilSuggestionByAlbum> {
        val albums = data.db.from(Albums)
            .innerJoin(AlbumImageRelations, AlbumImageRelations.albumId eq Albums.id)
            .select(Albums.id, Albums.title)
            .where { AlbumImageRelations.imageId eq imageId }
            .map { AlbumSimpleRes(it[Albums.id]!!, it[Albums.title]!!) }

        return albums.map { album ->
            val res = getMetaOfAlbum(album.id)
            MetaUtilSuggestionByAlbum(album, res.topics, res.authors, res.tags)
        }
    }

    /**
     * 获得指定illust的元数据。
     */
    fun getMetaOfIllust(illustId: Int): MetaUtilRes {
        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(IllustTopicRelations, IllustTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, Topics.type, IllustTopicRelations.isExported)
            .where { IllustTopicRelations.illustId eq illustId }
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[IllustTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(IllustAuthorRelations, IllustAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, Authors.type, IllustAuthorRelations.isExported)
            .where { IllustAuthorRelations.illustId eq illustId }
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[IllustAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(IllustTagRelations, IllustTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, IllustTagRelations.isExported)
            .where { (IllustTagRelations.illustId eq illustId) and (Tags.type eq Tag.Type.TAG) }
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[IllustTagRelations.isExported]!!) }

        return MetaUtilRes(topics, authors, tags)
    }

    /**
     * 获得指定album的元数据。
     */
    fun getMetaOfAlbum(albumId: Int): MetaUtilRes {
        val authorColors = data.metadata.meta.authorColors
        val topicColors = data.metadata.meta.topicColors

        val topics = data.db.from(Topics)
            .innerJoin(AlbumTopicRelations, AlbumTopicRelations.topicId eq Topics.id)
            .select(Topics.id, Topics.name, Topics.type, AlbumTopicRelations.isExported)
            .where { AlbumTopicRelations.albumId eq albumId }
            .orderBy(Topics.type.asc(), Topics.id.asc())
            .map {
                val topicType = it[Topics.type]!!
                val color = topicColors[topicType]
                TopicSimpleRes(it[Topics.id]!!, it[Topics.name]!!, topicType, it[AlbumTopicRelations.isExported]!!, color)
            }

        val authors = data.db.from(Authors)
            .innerJoin(AlbumAuthorRelations, AlbumAuthorRelations.authorId eq Authors.id)
            .select(Authors.id, Authors.name, Authors.type, AlbumAuthorRelations.isExported)
            .where { AlbumAuthorRelations.albumId eq albumId }
            .orderBy(Authors.type.asc(), Authors.id.asc())
            .map {
                val authorType = it[Authors.type]!!
                val color = authorColors[authorType]
                AuthorSimpleRes(it[Authors.id]!!, it[Authors.name]!!, authorType, it[AlbumAuthorRelations.isExported]!!, color)
            }

        val tags = data.db.from(Tags)
            .innerJoin(AlbumTagRelations, AlbumTagRelations.tagId eq Tags.id)
            .select(Tags.id, Tags.name, Tags.color, AlbumTagRelations.isExported)
            .where { (AlbumTagRelations.albumId eq albumId) and (Tags.type eq Tag.Type.TAG) }
            .orderBy(Tags.globalOrdinal.asc())
            .map { TagSimpleRes(it[Tags.id]!!, it[Tags.name]!!, it[Tags.color], it[AlbumTagRelations.isExported]!!) }

        return MetaUtilRes(topics, authors, tags)
    }
}