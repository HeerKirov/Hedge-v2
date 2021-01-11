package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.ResourceNotSuitable
import com.heerkirov.hedge.server.model.meta.Author
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.model.meta.Topic
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.entity.toList
import java.util.*
import kotlin.collections.HashMap
import kotlin.collections.HashSet

class MetaManager(private val data: DataRepository) {
    /**
     * 该方法使用在设置tag时，对tag进行校验并导出，返回声明式的tag列表。
     * @return 一组tag。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun validateAndExportTag(tagIds: List<Int>): List<Pair<Int, Boolean>> {
        val tags = data.db.sequenceOf(Tags).filter { it.id inList tagIds }.toList()
        if(tags.size < tags.size) {
            throw ResourceNotExist("tags", tagIds.toSet() - tags.asSequence().map { it.id }.toSet())
        }
        tags.filter { it.type != Tag.Type.TAG }.run {
            //只允许设定类型为TAG的标签，不允许地址段。
            if(isNotEmpty()) throw ResourceNotSuitable("tags", map { it.id })
        }

        return exportTag(tags)
    }

    /**
     * 该方法使用在设置topic时，对topic进行校验并导出，返回声明式的topic列表。
     * @return 一组topic。Int表示topic id，Boolean表示此topic是否为导出tag。
     */
    fun validateAndExportTopic(topicIds: List<Int>): List<Pair<Int, Boolean>> {
        val topics = data.db.sequenceOf(Topics).filter { it.id inList topicIds }.toList()
        if(topics.size < topicIds.size) {
            throw ResourceNotExist("topics", topicIds.toSet() - topics.asSequence().map { it.id }.toSet())
        }

        return exportTopic(topics)
    }

    /**
     * 该方法使用在设置author时，对author进行校验并导出，返回声明式的author列表。
     * @return 一组author。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun validateAuthor(authors: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Authors).select(Authors.id).where { Authors.id inList authors }.map { it[Authors.id]!! }
        if(ids.size < authors.size) {
            throw ResourceNotExist("authors", authors.toSet() - ids.toSet())
        }

        //author类型的标签没有导出机制，因此直接返回结果。
        return exportAuthorId(authors)
    }

    /**
     * 对tag进行导出。
     */
    fun exportTag(tags: List<Tag>, conflictingMembersCheck: Boolean = true): List<Pair<Int, Boolean>> {
        //记下所有访问过的节点父子关系
        val childrenMap = HashMap<Int, MutableSet<Int>>().apply { for (tag in tags) if(tag.parentId != null) computeIfAbsent(tag.parentId) { mutableSetOf() }.apply { add(tag.id) } }
        //已经访问过的节点。原tags列表的节点直接进去了
        val been = HashMap<Int, Tag?>(tags.size * 2).apply { tags.forEach { put(it.id, it) } }
        //等待访问的队列。将原tags列表的parent加进去
        val queue = LinkedList<Int>().apply { addAll(tags.mapNotNull { it.parentId }) }
        //导出的项的结果
        val exportedTags = LinkedList<Tag>()

        while(queue.isNotEmpty()) {
            val nextId = queue.pop()
            if(nextId !in been) {
                val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq nextId }
                if(tag != null) {
                    //只有虚拟地址段不会导出到关系表，其他类型都会导出。
                    if(tag.type != Tag.Type.VIRTUAL_ADDR) exportedTags.add(tag)
                    if(tag.parentId != null) {
                        queue.add(tag.parentId)
                        childrenMap.computeIfAbsent(tag.parentId) { mutableSetOf() }.apply { add(nextId) }
                    }
                    if(tag.links != null) queue.addAll(tag.links)
                }
                been[nextId] = tag
            }
        }

        val result = (tags.asSequence().map { it to false } + exportedTags.asSequence().map { it to true }).toList()

        if(conflictingMembersCheck) {
            //筛选出所有的强制冲突组
            val conflictingMembers = childrenMap.asSequence()
                .filter { (id, members) -> members.size > 1 && been[id]!!.isGroup.let { it == Tag.IsGroup.FORCE || it == Tag.IsGroup.FORCE_AND_SEQUENCE } }
                .map { (groupId, members) -> groupId to members.map { ConflictingGroupMembersError.ConflictingMember(it, been[it]!!.name) } }
                .toMap()
            //检查存在冲突成员时，抛出强制冲突异常
            if(conflictingMembers.isNotEmpty()) throw ConflictingGroupMembersError(conflictingMembers)
        }

        return result.map { (tag, isExported) -> Pair(tag.id, isExported) }
    }

    /**
     * 对topic进行导出。
     */
    fun exportTopic(topics: List<Topic>): List<Pair<Int, Boolean>> {
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
     * 对author进行导出。
     */
    fun exportAuthorId(authorIds: List<Int>): List<Pair<Int, Boolean>> {
        return authorIds.map { it to false }
    }

    /**
     * 对author进行导出。
     */
    fun exportAuthor(authors: List<Author>): List<Pair<Int, Boolean>> {
        return authors.map { it.id to false }
    }
}