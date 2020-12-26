package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.Authors
import com.heerkirov.hedge.server.dao.Tags
import com.heerkirov.hedge.server.dao.Topics
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.Tag
import com.heerkirov.hedge.server.model.Topic
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.entity.toList
import java.util.*
import kotlin.collections.HashSet

class MetaManager(private val data: DataRepository) {
    /**
     * 该方法使用在设置tag时，对tag进行校验并导出，返回声明式的tag列表。
     * @return 一组tag。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun exportTag(tagIds: List<Int>): List<Pair<Int, Boolean>> {
        val tags = data.db.sequenceOf(Tags).filter { it.id inList tagIds }.toList()
        if(tags.size < tags.size) {
            throw ResourceNotExist("tags", tagIds.toSet() - tags.asSequence().map { it.id }.toSet())
        }

        val been = HashSet<Int>(tags.size * 2).apply { addAll(tags.map { it.id }) }
        val queue = LinkedList<Int>().apply { addAll(tags.mapNotNull { it.parentId }) }
        val exportedTags = LinkedList<Tag>()

        while(queue.isNotEmpty()) {
            val nextId = queue.pop()
            if(nextId !in been) {
                val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq nextId }
                if(tag != null) {
                    //只有虚拟地址段不会导出到关系表，其他类型都会导出。
                    if(tag.type != Tag.Type.VIRTUAL_ADDR) exportedTags.add(tag)
                    if(tag.parentId != null) queue.add(tag.parentId)
                    if(tag.links != null) queue.addAll(tag.links)
                }
                been.add(nextId)
            }
        }

        val result = (tags.asSequence().map { it to false } + exportedTags.asSequence().map { it to true }).toList()

        //筛选出所有的强制冲突组
        val conflictingGroups = result.asSequence()
            .filter { (tag, _) -> tag.isGroup == Tag.IsGroup.FORCE || tag.isGroup == Tag.IsGroup.FORCE_AND_SEQUENCE }
            .map { (tag, _) -> tag.id }
            .toSet()
        //筛选出所有的强制冲突组的成员，分组，然后筛选出具有冲突的组及成员
        val conflictingMembers = result.asSequence()
            .filter { (tag, _) -> tag.parentId != null && tag.parentId in conflictingGroups }
            .map { (tag, _) -> tag }
            .groupBy { it.parentId!! }.entries.asSequence()
            .filter { (_, members) -> members.size > 1 }
            .map { (groupId, members) -> groupId to members.map { ConflictingGroupMembersError.ConflictingMember(it.id, it.name) } }
            .toMap()
        //检查存在冲突成员时，抛出强制冲突异常
        if(conflictingMembers.isNotEmpty()) throw ConflictingGroupMembersError(conflictingMembers)

        return result.map { (tag, isExported) -> Pair(tag.id, isExported) }
    }

    /**
     * 该方法使用在设置topic时，对topic进行校验并导出，返回声明式的topic列表。
     * @return 一组topic。Int表示topic id，Boolean表示此topic是否为导出tag。
     */
    fun exportTopic(topicIds: List<Int>): List<Pair<Int, Boolean>> {
        val topics = data.db.sequenceOf(Topics).filter { it.id inList topicIds }.toList()
        if(topics.size < topicIds.size) {
            throw ResourceNotExist("topics", topicIds.toSet() - topics.asSequence().map { it.id }.toSet())
        }

        val been = HashSet<Int>(topics.size * 2).apply { addAll(topics.map { it.id }) }
        val queue = LinkedList<Int>().apply { addAll(topics.mapNotNull { it.parentId }) }
        val exportedTopics = LinkedList<Topic>()

        while(queue.isNotEmpty()) {
            val nextId = queue.pop()
            if(nextId !in been) {
                val topic = data.db.sequenceOf(Topics).firstOrNull { it.id eq nextId }
                if(topic != null) {
                    exportedTopics.add(topic)
                    if(topic.parentId != null) queue.add(topic.parentId)
                }
                been.add(nextId)
            }
        }

        return topics.map { Pair(it.id, false) } + exportedTopics.map { Pair(it.id, true) }
    }

    /**
     * 该方法使用在设置author时，对author进行校验并导出，返回声明式的author列表。
     * @return 一组author。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun exportAuthor(authors: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Authors).select(Authors.id).where { Authors.id inList authors }.map { it[Authors.id]!! }
        if(ids.size < authors.size) {
            throw ResourceNotExist("authors", authors.toSet() - ids.toSet())
        }

        //author类型的标签没有导出机制，因此直接返回结果。
        return authors.map { Pair(it, false) }
    }
}