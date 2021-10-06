package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.filterInto
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class MetaUtilService(private val data: DataRepository, private val metaManager: MetaManager) {
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
}