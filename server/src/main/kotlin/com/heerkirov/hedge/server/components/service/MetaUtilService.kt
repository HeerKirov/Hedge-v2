package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.MetaUtilKit
import com.heerkirov.hedge.server.components.manager.MetaHistoryManager
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.components.manager.SourceMappingManager
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.enums.IdentityType
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.filterInto
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import org.ktorm.dsl.*
import org.ktorm.entity.any
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class MetaUtilService(private val data: DataRepository,
                      private val kit: MetaUtilKit,
                      private val metaManager: MetaManager,
                      private val metaHistoryManager: MetaHistoryManager) {
    /**
     * 对metaTag做内容校验和推导。它实际上是metaTag保存流程的一部分。
     * 这个API用于metaTag编辑器，实时对metaTag列表做验证，获得全局的推导结果，并提前得知错误关系。
     * @throws ResourceNotExist ("tags" | "topics" | "authors", number[]) 相应的元数据资源不存在。给出不存在的meta id列表
     */
    fun validate(form: MetaUtilValidateForm): MetaUtilValidateRes {
        val notSuitable: List<TagSimpleRes>
        val conflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>
        val forceConflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>
        val exportedTags = if(!form.tags.isNullOrEmpty()) {
            val tags = data.db.sequenceOf(Tags).filter { it.id inList form.tags }.toList()
            if(tags.size < form.tags.size) {
                throw be(ResourceNotExist("tags", form.tags.toSet() - tags.asSequence().map { it.id }.toSet()))
            }
            //只允许设定类型为TAG的标签，不允许地址段。
            notSuitable = tags.filter { it.type != Tag.Type.TAG }.map { TagSimpleRes(it.id, it.name, it.color, false) }
            //导出，检查冲突组限制，提出警告和错误
            val (exported, tagExportError) = metaManager.exportTagModel(tags)
            val (forceConflicting, conflicting) = tagExportError?.info?.filterInto { it.force } ?: (emptyList<ConflictingGroupMembersError.ConflictingMembers>() to emptyList())
            conflictingMembers = conflicting
            forceConflictingMembers = forceConflicting
            exported
        }else{
            notSuitable = emptyList()
            conflictingMembers = emptyList()
            forceConflictingMembers = emptyList()
            emptyList()
        }

        val exportedTopics = if(!form.topics.isNullOrEmpty()) {
            val topics = data.db.sequenceOf(Topics).filter { it.id inList form.topics }.toList()
            if(topics.size < form.topics.size) {
                throw be(ResourceNotExist("topics", form.topics.toSet() - topics.asSequence().map { it.id }.toSet()))
            }
            //导出
            metaManager.exportTopicModel(topics)
        }else{
            emptyList()
        }

        val exportedAuthors = if(!form.authors.isNullOrEmpty()) {
            val authors = data.db.sequenceOf(Authors).filter { it.id inList form.authors }.toList()
            if(authors.size < form.authors.size) {
                throw be(ResourceNotExist("authors", form.authors.toSet() - authors.toSet()))
            }
            //导出 (虽然是假的导出)
            metaManager.exportAuthorModel(authors)
        }else{
            emptyList()
        }

        val topicColors = data.metadata.meta.topicColors
        val authorColors = data.metadata.meta.authorColors

        return MetaUtilValidateRes(
            exportedTopics.asSequence()
                .sortedWith { (a, _), (b, _) -> a.type.compareTo(b.type).let { if(it == 0) a.id.compareTo(b.id) else it } }
                .map { (topic, isExported) -> TopicSimpleRes(topic.id, topic.name, topic.type, isExported, topicColors[topic.type]) }
                .toList(),
            exportedAuthors.asSequence()
                .sortedWith { (a, _), (b, _) -> a.type.compareTo(b.type).let { if(it == 0) a.id.compareTo(b.id) else it } }
                .map { (author, isExported) -> AuthorSimpleRes(author.id, author.name, author.type, isExported, authorColors[author.type]) }
                .toList(),
            exportedTags.asSequence()
                .sortedBy { (t, _) -> t.globalOrdinal }
                .map { (tag, isExported) -> TagSimpleRes(tag.id, tag.name, tag.color, isExported) }
                .toList(),
            notSuitable,
            conflictingMembers,
            forceConflictingMembers)
    }

    /**
     * 根据给出的元素和关联方式，推导出建议使用的元数据列表。
     * @throws ResourceNotExist ("imageId" | "collectionId" | "albumId", number)
     */
    fun suggest(form: MetaUtilIdentityForm): List<MetaUtilSuggestionRes> {
        return when (form.type) {
            IdentityType.IMAGE -> {
                //对于image，获得：parent的元数据; associate的元数据; 每一个已加入的album的元数据
                val row = data.db.from(Illusts).select(Illusts.associateId, Illusts.parentId)
                    .where { (Illusts.id eq form.id) and (Illusts.type notEq Illust.Type.COLLECTION) }
                    .limit(1)
                    .firstOrNull() ?: throw be(ResourceNotExist("imageId", form.id))
                val associateId = row[Illusts.associateId]
                val parentId = row[Illusts.parentId]

                val ret = mutableListOf<MetaUtilSuggestionRes>()
                if(parentId != null) ret.add(kit.suggestMetaOfCollection(parentId))
                ret.addAll(kit.suggestMetaOfAlbum(form.id))
                if(associateId != null) ret.add(kit.suggestMetaOfAssociate(associateId))
                ret
            }
            IdentityType.COLLECTION -> {
                //对于collection，获得：所有children的元数据; associate的元数据
                val row = data.db.from(Illusts).select(Illusts.associateId)
                    .where { (Illusts.id eq form.id) and (Illusts.type eq Illust.Type.COLLECTION) }
                    .limit(1)
                    .firstOrNull() ?: throw be(ResourceNotExist("collectionId", form.id))
                val associateId = row[Illusts.associateId]

                val ret = mutableListOf<MetaUtilSuggestionRes>()
                ret.add(kit.suggestMetaOfCollectionChildren(form.id))
                if(associateId != null) ret.add(kit.suggestMetaOfAssociate(associateId))
                ret
            }
            IdentityType.ALBUM -> {
                //对于album，获得：所有item的元数据
                listOf(kit.suggestMetaOfAlbumChildren(form.id))
            }
        }
    }

    /**
     * 查看编辑过的对象的历史列表。
     */
    fun getHistoryIdentityList(): List<MetaUtilIdentity> {
        return metaHistoryManager.getIdentities()
    }

    /**
     * 获得某一项历史对象的metaTag详情。
     * @throws NotFound 无法找到目标对象。
     */
    fun getHistoryIdentityDetail(type: IdentityType, id: Int): MetaUtilRes {
        return when (type) {
            IdentityType.IMAGE -> {
                if(!data.db.sequenceOf(Illusts).filter { (it.id eq id) and (it.type notEq Illust.Type.COLLECTION) }.any()) throw be(NotFound())
                kit.getMetaOfIllust(id)
            }
            IdentityType.COLLECTION -> {
                if(!data.db.sequenceOf(Illusts).filter { (it.id eq id) and (it.type eq Illust.Type.COLLECTION) }.any()) throw be(NotFound())
                kit.getMetaOfIllust(id)
            }
            else -> {
                if(!data.db.sequenceOf(Albums).filter { it.id eq id }.any()) throw be(NotFound())
                kit.getMetaOfAlbum(id)
            }
        }
    }

    /**
     * 添加对象到历史。
     */
    fun pushHistoryIdentity(form: MetaUtilIdentityForm) {
        metaHistoryManager.addIdentity(form.type, form.id)
    }

    /**
     * 查看最近使用过的metaTag的列表。
     */
    fun getHistoryMetaRecent(): MetaUtilRes {
        val metas = metaHistoryManager.getMetasByRecent()
        return mapMetasToEntities(metas)
    }

    /**
     * 查看最近一段时间统计的metaTag最高频率使用的列表。
     */
    fun getHistoryMetaFrequent(): MetaUtilRes {
        val metas = metaHistoryManager.getMetasByFrequent()
        return mapMetasToEntities(metas)
    }

    /**
     * 添加一组metaTag到历史。
     */
    fun pushHistoryMeta(form: MetaUtilMetaForm) {
        data.db.transaction {
            form.metas.forEach { (type, id) -> metaHistoryManager.addMeta(type, id) }
        }
    }

    /**
     * 清空所有metaTag历史记录。
     */
    fun deleteAllHistoryMeta() {
        metaHistoryManager.clearMeta()
    }

    /**
     * 将manager返回的meta与id的综合列表保持顺序映射成实体。
     */
    private fun mapMetasToEntities(metas: Map<MetaType, List<Int>>): MetaUtilRes {
        val topics = metas[MetaType.TOPIC].let { topicIds ->
            if(topicIds.isNullOrEmpty()) emptyList() else {
                val topicColors = data.metadata.meta.topicColors
                val result = data.db.from(Topics)
                    .select(Topics.id, Topics.name, Topics.type)
                    .where { Topics.id inList topicIds }
                    .associate {
                        val id = it[Topics.id]!!
                        val type = it[Topics.type]!!
                        val color = topicColors[type]
                        id to TopicSimpleRes(id, it[Topics.name]!!, type, false, color)
                    }
                topicIds.mapNotNull(result::get)
            }
        }

        val authors = metas[MetaType.AUTHOR].let { authorIds ->
            if(authorIds.isNullOrEmpty()) emptyList() else {
                val authorColors = data.metadata.meta.authorColors
                val result = data.db.from(Authors)
                    .select(Authors.id, Authors.name, Authors.type)
                    .where { Authors.id inList authorIds }
                    .associate {
                        val id = it[Authors.id]!!
                        val type = it[Authors.type]!!
                        val color = authorColors[type]
                        id to AuthorSimpleRes(id, it[Authors.name]!!, type, false, color)
                    }
                authorIds.mapNotNull(result::get)
            }
        }

        val tags = metas[MetaType.TAG].let { tagIds ->
            if(tagIds.isNullOrEmpty()) emptyList() else {
                val result = data.db.from(Tags)
                    .select(Tags.id, Tags.name, Tags.color)
                    .where { Tags.id inList tagIds }
                    .associate {
                        val id = it[Tags.id]!!
                        id to TagSimpleRes(id, it[Tags.name]!!, it[Tags.color], false)
                    }
                tagIds.mapNotNull(result::get)
            }
        }

        return MetaUtilRes(topics, authors, tags)
    }
}