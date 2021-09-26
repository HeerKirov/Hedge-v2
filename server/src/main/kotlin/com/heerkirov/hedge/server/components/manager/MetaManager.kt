package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.types.EntityAnnotationRelationTable
import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.dao.types.MetaAnnotationRelationTable
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.ResourceNotSuitable
import com.heerkirov.hedge.server.model.meta.Author
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.runIf
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList
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
    fun validateAndExportAuthor(authors: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Authors).select(Authors.id).where { Authors.id inList authors }.map { it[Authors.id]!! }
        if(ids.size < authors.size) {
            throw ResourceNotExist("authors", authors.toSet() - ids.toSet())
        }

        //author类型的标签没有导出机制，因此直接返回结果。
        return ids.map { it to false }
    }

    /**
     * 对tag进行导出。
     * @param conflictingMembersCheck 对冲突组进行检查，并抛出异常。
     * @param onlyForceConflicting 只检查强制冲突组，而忽略非强制。
     * @exception ConflictingGroupMembersError 发现冲突组时，抛出此异常。
     */
    fun exportTag(tags: List<Tag>, conflictingMembersCheck: Boolean = true, onlyForceConflicting: Boolean = true): List<Pair<Int, Boolean>> {
        //记下所有访问过的节点父子关系
        val childrenMap = HashMap<Int, MutableSet<Int>>().apply { for (tag in tags) if(tag.parentId != null) computeIfAbsent(tag.parentId) { mutableSetOf() }.apply { add(tag.id) } }
        //已经访问过的节点。原tags列表的节点直接进去了
        val been = HashMap<Int, Tag?>(tags.size * 2).apply { tags.forEach { put(it.id, it) } }
        //等待访问的队列。将原tags列表的parent和links直接加进去
        val queue = LinkedList<Int>().apply { addAll(tags.mapNotNull { it.parentId }) }.apply { addAll(tags.flatMap { it.links ?: emptyList() }) }
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

        val result = (tags.asSequence().map { it to false } + exportedTags.asSequence().map { it to true }).map { (tag, isExported) -> tag.id to isExported }.toList()

        if(conflictingMembersCheck) {
            val isExportedMap = result.toMap()
            val condition: (Tag.IsGroup) -> Boolean = if(onlyForceConflicting) { { it == Tag.IsGroup.FORCE || it == Tag.IsGroup.FORCE_AND_SEQUENCE } } else { { it != Tag.IsGroup.NO } }
            //筛选出所有的强制冲突组
            val conflictingMembers = childrenMap.asSequence()
                .filter { (id, members) -> members.size > 1 && been[id]!!.isGroup.let(condition) }
                .map { (groupId, members) ->
                    val groupTag = been[groupId]!!
                    val groupMember = ConflictingGroupMembersError.Member(groupTag.id, groupTag.name, groupTag.color, isExportedMap.getOrDefault(groupId, true))
                    val force = groupTag.isGroup == Tag.IsGroup.FORCE || groupTag.isGroup == Tag.IsGroup.FORCE_AND_SEQUENCE
                    ConflictingGroupMembersError.ConflictingMembers(groupMember, force, members.map { ConflictingGroupMembersError.Member(it, been[it]!!.name, been[it]!!.color, isExportedMap.getOrDefault(it, true)) })
                }
                .toList()
            //检查存在冲突成员时，抛出强制冲突异常
            if(conflictingMembers.isNotEmpty()) throw ConflictingGroupMembersError(conflictingMembers)
        }

        return result
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

        return topics.map { it.id to false } + exportedTopics.map { it.id to true }
    }

    /**
     * 对author进行导出。
     */
    fun exportAuthor(authors: List<Author>): List<Pair<Int, Boolean>> {
        return authors.map { it.id to false }
    }

    /**
     * 检验并处理某一种类的meta tag，并返回它导出的annotations。
     * @return 返回由此列meta tag导出的annotation的id列表。
     */
    fun <T, R, RA> processMetaTags(thisId: Int, creating: Boolean = false, analyseStatisticCount: Boolean, newTagIds: List<Pair<Int, Boolean>>,
                                   metaTag: T, metaRelations: R, metaAnnotationRelations: RA): Set<Int>
            where T: MetaTag<*>, R: EntityMetaRelationTable<*>, RA: MetaAnnotationRelationTable<*> {
        val now = DateTime.now()

        val tagIds = newTagIds.toMap()
        val oldTagIds = if(creating) emptyMap() else {
            data.db.from(metaRelations).select(metaRelations.metaId(), metaRelations.exported())
                .where { metaRelations.entityId() eq thisId }
                .asSequence()
                .map { Pair(it[metaRelations.metaId()]!!, it[metaRelations.exported()]!!) }
                .toMap()
        }
        val deleteIds = oldTagIds.keys - tagIds.keys
        if(deleteIds.isNotEmpty()) {
            data.db.delete(metaRelations) { (metaRelations.entityId() eq thisId) and (metaRelations.metaId() inList deleteIds) }
        }
        if(analyseStatisticCount) {
            data.db.update(metaTag) {
                where { it.id inList deleteIds }
                set(it.cachedCount, it.cachedCount minus 1)
                set(it.updateTime, now)
            }
        }

        val addIds = tagIds - oldTagIds.keys
        if(addIds.isNotEmpty()) {
            data.db.batchInsert(metaRelations) {
                for ((addId, isExported) in addIds) {
                    item {
                        set(metaRelations.entityId(), thisId)
                        set(metaRelations.metaId(), addId)
                        set(metaRelations.exported(), isExported)
                    }
                }
            }
        }
        if(analyseStatisticCount) {
            data.db.update(metaTag) {
                where { it.id inList addIds.keys }
                set(it.cachedCount, it.cachedCount plus 1)
                set(it.updateTime, now)
            }
        }

        val changeIds = (tagIds.keys intersect oldTagIds.keys).flatMap { id ->
            val newExported = tagIds[id]
            val oldExported = oldTagIds[id]
            if(newExported != oldExported) sequenceOf(Pair(id, newExported!!)) else emptySequence()
        }
        if(changeIds.isNotEmpty()) {
            data.db.batchUpdate(metaRelations) {
                for ((changeId, isExported) in changeIds) {
                    item {
                        where { (metaRelations.entityId() eq thisId) and (metaRelations.metaId() eq changeId) }
                        set(metaRelations.exported(), isExported)
                    }
                }
            }
        }

        return getAnnotationsOfMetaTags(tagIds.keys, metaAnnotationRelations)
    }

    /**
     * 删除此关系关联的全部tag。
     * @param remainNotExported 保留not exported的tag，也就是只删除exported tag。
     */
    fun <R : EntityMetaRelationTable<*>, T : MetaTag<*>> deleteMetaTags(id: Int, metaRelations: R, metaTag: T, analyseStatisticCount: Boolean, remainNotExported: Boolean = false) {
        val condition = (metaRelations.entityId() eq id).runIf(remainNotExported) { this and metaRelations.exported() }
        if(analyseStatisticCount) {
            val ids = data.db.from(metaRelations).select(metaRelations.metaId()).where { condition }.map { it[metaRelations.metaId()]!! }
            data.db.delete(metaRelations) { condition }
            //修改统计计数
            data.db.update(metaTag) {
                where { it.id inList ids }
                set(it.cachedCount, it.cachedCount minus 1)
                set(it.updateTime, DateTime.now())
            }
        }else{
            data.db.delete(metaRelations) { condition }
        }
    }

    /**
     * 取得此关联对象的关系上的全部not exported的关联标签。
     */
    fun <R : EntityMetaRelationTable<*>, T : MetaTag<M>, M : Any> getNotExportMetaTags(id: Int, metaRelations: R, metaTag: T): List<M> {
        return data.db.from(metaRelations)
            .innerJoin(metaTag, metaRelations.metaId() eq metaTag.id)
            .select(metaTag.columns)
            .where { (metaRelations.entityId() eq id) and (metaRelations.exported().not()) }
            .map { metaTag.createEntity(it) }
    }

    /**
     * 判断此关系直接关联(not exported)的对象是否存在。存在任意一个即返回true。
     */
    fun <R> getNotExportedMetaCount(id: Int, metaRelations: R): Int where R: EntityMetaRelationTable<*> {
        return data.db.from(metaRelations).select(count().aliased("count"))
            .where { (metaRelations.entityId() eq id) and (metaRelations.exported().not()) }
            .firstOrNull()?.getInt("count") ?: 0
    }

    /**
     * 根据一个meta tag列表，取得这个列表关联的全部annotations的id列表。
     */
    fun <RA : MetaAnnotationRelationTable<*>> getAnnotationsOfMetaTags(metaIds: Collection<Int>, metaAnnotationRelations: RA): Set<Int> {
        return if(metaIds.isEmpty()) emptySet() else
            data.db.from(metaAnnotationRelations)
                .innerJoin(Annotations, (metaAnnotationRelations.annotationId() eq Annotations.id) and Annotations.canBeExported)
                .select(Annotations.id)
                .where { metaAnnotationRelations.metaId() inList metaIds }
                .asSequence()
                .map { it[Annotations.id]!! }
                .toSet()
    }

    /**
     * 删除此关系关联的全部annotations。
     */
    fun <RA : EntityAnnotationRelationTable<*>> deleteAnnotations(id: Int, entityAnnotationRelations: RA) {
        data.db.delete(entityAnnotationRelations) { it.entityId() eq id }
    }
}