package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAnnotation
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAuthor
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTag
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTopic
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.runIf
import org.ktorm.dsl.*
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import kotlin.collections.ArrayList

class MetaQueryer(private val data: DataRepository) : Queryer {
    private val parser = MetaParserUtil
    private val queryLimit get() = data.metadata.query.queryLimitOfQueryItems

    override fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag> {
        /**
         * 判断标签是否能匹配address。
         */
        fun isAddressMatches(tagId: Int?, address: MetaAddress, nextAddr: Int): Boolean {
            //对address的处理方法：当address为A.B.C...M.N时，首先查找所有name match N的entity。
            //随后对于每一个entity，根据其parentId向上查找其所有父标签。当找到一个父标签满足一个地址段M时，就将要匹配的地址段向前推1(L, K, J, ..., C, B, A)。
            //如果address的每一节都被匹配，那么此entity符合条件；如果parent前推到了root依然没有匹配掉所有的address，那么不符合条件。
            return when {
                nextAddr < 0 -> true
                tagId == null -> false
                else -> {
                    val tag = tagItemsPool.computeIfAbsent(tagId) {
                        data.db.from(Tags).select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.isGroup, Tags.color)
                            .where { Tags.id eq tagId }
                            .limit(0, 1)
                            .first()
                            .let { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.isGroup]!!, it[Tags.color]) }
                    }
                    isAddressMatches(tag.parentId, address, if(parser.isNameEqualOrMatch(address[nextAddr], tag)) { nextAddr - 1 }else{ nextAddr })
                }
            }
        }

        /**
         * 查找与metaString符合的tag items。
         */
        fun findTagsByMetaString(metaString: MetaString): List<TagItem> {
            return tagByStringPool.computeIfAbsent(metaString) {
                data.db.from(Tags)
                    .select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.isGroup, Tags.color)
                    .where { parser.compileNameString(metaString, Tags) }
                    .limit(0, queryLimit)
                    .map { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.isGroup]!!, it[Tags.color]) }
                    .onEach { tagItemsPool[it.id] = it }
            }
        }

        /**
         * 查找指定id的tag item。
         */
        fun findTagById(tagId: Int): TagItem {
            return tagItemsPool.computeIfAbsent(tagId) {
                data.db.from(Tags)
                    .select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.isGroup, Tags.color)
                    .where { Tags.id eq it }
                    .limit(0, 1)
                    .first()
                    .let { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.isGroup]!!, it[Tags.color]) }
            }
        }

        /**
         * 查找指定parentId的子标签，且与metaString列表符合的tag items。
         */
        fun findChildrenTags(parentId: Int): List<TagItem> {
            return tagChildrenPool.computeIfAbsent(parentId) {
                data.db.from(Tags)
                    .select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.isGroup, Tags.color)
                    .where { Tags.parentId eq parentId }
                    .orderBy(Tags.ordinal.asc())
                    .map { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.isGroup]!!, it[Tags.color]) }
                    .onEach { tagItemsPool[it.id] = it }
            }
        }

        /**
         * 查找指定标签的真实标签。用于当目标标签是virtual addr时。
         */
        fun findRealTags(tagId: Int): List<ElementTag.RealTag> {
            val result = ArrayList<TagItem>()
            val queue = LinkedList<Int>().apply { add(tagId) }
            //从tagId开始迭代，查找子标签列表，将实体标签加入结果，并继续迭代虚拟标签，直到全部迭代为实体
            while (queue.isNotEmpty()) {
                val id = queue.poll()
                val (virtualChildren, children) = findChildrenTags(id).partition { it.type == Tag.Type.VIRTUAL_ADDR }
                result.addAll(children)
                queue.addAll(virtualChildren.map { it.id })
            }

            return result.map { ElementTag.RealTag(it.id, it.name, it.type) }
        }

        /**
         * 从序列中过滤出类型是group的tag，并且只取第一项返回。如果存在结果但没有group，那么发出警告。
         * @param sequence 要求是sequence group。
         */
        fun Sequence<TagItem>.filterGroupAndWarn(metaAddress: MetaAddress, sequence: Boolean = false): Sequence<TagItem> {
            val (yes, no) = if(sequence) {
                partition { it.isGroup == Tag.IsGroup.SEQUENCE || it.isGroup == Tag.IsGroup.FORCE_AND_SEQUENCE }
            }else{
                partition { it.isGroup != Tag.IsGroup.NO }
            }
            return if(yes.isNotEmpty()) {
                sequenceOf(yes.first())
            }else{
                if(no.isNotEmpty()) {
                    collector.warning(ElementMatchedButNotGroup(
                        metaAddress.joinToString(".") { it.revertToQueryString() },
                        if (sequence) ElementMatchedButNotGroup.MatchGoal.SEQUENCE_GROUP else ElementMatchedButNotGroup.MatchGoal.GROUP
                    ))
                }
                emptySequence()
            }
        }

        /**
         * 从序列中过滤出其parent是sequence group的tag，并只取第一项返回。如果存在结果但没有group member，那么发出警告。
         */
        fun Sequence<TagItem>.filterGroupMemberAndWarn(metaAddress: MetaAddress): Sequence<TagItem> {
            val (yes, no) = partition { it.parentId != null && findTagById(it.parentId).run { isGroup == Tag.IsGroup.SEQUENCE || isGroup == Tag.IsGroup.FORCE_AND_SEQUENCE } }

            return if(yes.isNotEmpty()) {
                sequenceOf(yes.first())
            }else{
                if(no.isNotEmpty()) {
                    collector.warning(ElementMatchedButNotGroup(
                        metaAddress.joinToString(".") { it.revertToQueryString() },
                        ElementMatchedButNotGroup.MatchGoal.SEQUENCE_GROUP_MEMBER
                    ))
                }
                emptySequence()
            }
        }

        return when (metaValue) {
            is SimpleMetaValue -> {
                if(metaValue.value.any { it.value.isBlank() }) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }

                findTagsByMetaString(metaValue.value.last()) //查找与最后一节对应的tag
                    .asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.value, metaValue.value.size - 2) } //过滤匹配address
            }
            is SequentialMetaValueOfCollection -> {
                //组匹配，且使用集合选择组员
                if(metaValue.tag.any { it.value.isBlank() }) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }
                val childrenValues = metaValue.values.filter { it.value.isNotBlank() }
                if(childrenValues.size < metaValue.values.size) {
                    //有元素内容为空时抛出空警告
                    collector.warning(BlankElement())
                }

                findTagsByMetaString(metaValue.tag.last()) //查找与最后一节对应的tag
                    .asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.tag, metaValue.tag.size - 2) } //过滤匹配address
                    .filterGroupAndWarn(metaValue.tag, sequence = false) //过滤group
                    .flatMap { parentTag -> findChildrenTags(parentTag.id) } //将group转为children group，并直接展平
                    .filter { childrenValues.any { metaString -> parser.isNameEqualOrMatch(metaString, it) } } //children按照values做任一匹配
            }
            is SequentialMetaValueOfRange -> {
                //组匹配，且使用集合选择组员
                if(metaValue.tag.any { it.value.isBlank() }) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }
                if((metaValue.begin != null && metaValue.begin.value.isBlank()) || (metaValue.end != null && metaValue.end.value.isBlank())) {
                    //begin/end为空时抛出空警告
                    collector.warning(BlankElement())
                }

                findTagsByMetaString(metaValue.tag.last()) //查找与最后一节对应的tag
                    .asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.tag, metaValue.tag.size - 2) } //过滤匹配address
                    .filterGroupAndWarn(metaValue.tag, sequence = true) //过滤sequence group
                    .map { parentTag -> findChildrenTags(parentTag.id) } //将group转为children group
                    .flatMap { childrenGroup -> //children group找出begin end然后取中间
                        val beginOrdinal = (if(metaValue.begin == null || metaValue.begin.value.isBlank()) null else childrenGroup.indexOfFirst { parser.isNameEqualOrMatch(metaValue.begin, it) }.let {
                            if(it >= 0) it else {
                                collector.warning(RangeElementNotFound(metaValue.begin.revertToQueryString()))
                                null
                            }
                        })?.runIf(!metaValue.includeBegin) { this + 1 } ?: 0

                        val endOrdinal = (if(metaValue.end == null || metaValue.end.value.isBlank()) null else childrenGroup.indexOfLast { parser.isNameEqualOrMatch(metaValue.end, it) }.let {
                            if(it >= 0) it else {
                                collector.warning(RangeElementNotFound(metaValue.end.revertToQueryString()))
                                null
                            }
                        })?.runIf(metaValue.includeEnd) { this + 1 } ?: childrenGroup.size

                        if(endOrdinal > beginOrdinal) childrenGroup.subList(beginOrdinal, endOrdinal) else emptyList()
                    }
            }
            is SequentialItemMetaValueToOther -> {
                //序列化匹配，且使用~选择两个组员
                if(metaValue.tag.any { it.value.isBlank() } || metaValue.otherTag.value.isBlank()) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }

                findTagsByMetaString(metaValue.tag.last()) //查找与最后一节对应的tag
                    .asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.tag, metaValue.tag.size - 2) } //过滤匹配address
                    .filterGroupMemberAndWarn(metaValue.tag) //过滤出sequence group member
                    .flatMap { mainTag -> //children group找出当前项和other项然后取中间
                        val childrenGroup = findChildrenTags(mainTag.parentId!!)
                        val otherTagOrdinal = childrenGroup.indexOfFirst { parser.isNameEqualOrMatch(metaValue.otherTag, it) }
                        val mainTagOrdinal = childrenGroup.indexOfFirst { it.id == mainTag.id }.also {
                            if(it < 0) throw java.lang.RuntimeException("Cannot find main tag [${mainTag.id}]'${mainTag.name}' in children group.")
                        }
                        if(otherTagOrdinal >= 0) {
                           if(otherTagOrdinal > mainTagOrdinal) {
                               childrenGroup.subList(mainTagOrdinal, otherTagOrdinal + 1)
                           }else{
                               childrenGroup.subList(otherTagOrdinal, mainTagOrdinal + 1)
                           }
                        }else{
                            collector.warning(RangeElementNotFound(metaValue.otherTag.revertToQueryString()))
                            emptyList()
                        }
                    }
            }
            is SequentialItemMetaValueToDirection -> {
                //序列化匹配，从选择的组员开始到一个方向
                if(metaValue.tag.any { it.value.isBlank() }) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }

                findTagsByMetaString(metaValue.tag.last()) //查找与最后一节对应的tag
                    .asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.tag, metaValue.tag.size - 2) } //过滤匹配address
                    .filterGroupMemberAndWarn(metaValue.tag) //过滤出sequence group member
                    .flatMap { mainTag -> //children group找出当前项，然后截取一半
                        val childrenGroup = findChildrenTags(mainTag.parentId!!)
                        val mainTagOrdinal = childrenGroup.indexOfFirst { it.id == mainTag.id }.also {
                            if(it < 0) throw java.lang.RuntimeException("Cannot find main tag [${mainTag.id}]'${mainTag.name}' in children group.")
                        }
                        if(metaValue.isAscending()) {
                            childrenGroup.subList(mainTagOrdinal, childrenGroup.size)
                        }else{
                            childrenGroup.subList(0, mainTagOrdinal + 1)
                        }
                    }
            }
            else -> throw RuntimeException("Unsupported metaValue type ${metaValue::class.simpleName}.")
        }.map { ElementTag(it.id, it.name, it.type, it.color, if(it.type == Tag.Type.VIRTUAL_ADDR) findRealTags(it.id) else null) }.toList().also {
            if(it.isEmpty()) {
                //查询结果为空时抛出无匹配警告
                collector.warning(ElementMatchesNone(metaValue.revertToQueryString()))
            }
        }
    }

    override fun findTopic(metaValue: SimpleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTopic> {
        if(metaValue.value.any { it.value.isBlank() }) {
            //元素内容为空时抛出空警告并直接返回
            collector.warning(BlankElement())
            return emptyList()
        }

        fun isAddressMatches(topicId: Int?, address: MetaAddress, nextAddr: Int): Boolean {
            //对address的处理方法：当address为A.B.C...M.N时，首先查找所有name match N的entity。
            //随后对于每一个entity，根据其parentId向上查找其所有父标签。当找到一个父标签满足一个地址段M时，就将要匹配的地址段向前推1(L, K, J, ..., C, B, A)。
            //如果address的每一节都被匹配，那么此entity符合条件；如果parent前推到了root依然没有匹配掉所有的address，那么不符合条件。
            return when {
                nextAddr < 0 -> true
                topicId == null -> false
                else -> {
                    val topic = topicItemsPool.computeIfAbsent(topicId) {
                        data.db.from(Topics).select(Topics.id, Topics.name, Topics.otherNames, Topics.parentId)
                            .where { Topics.id eq topicId }
                            .limit(0, 1)
                            .first()
                            .let { TopicItem(it[Topics.id]!!, it[Topics.name]!!, it[Topics.otherNames]!!, it[Topics.parentId]) }
                    }
                    isAddressMatches(topic.parentId, address, if(parser.isNameEqualOrMatch(address[nextAddr], topic)) { nextAddr - 1 }else{ nextAddr })
                }
            }
        }

        return topicCacheMap.computeIfAbsent(metaValue.value) { address ->
            val lastAddr = address.last()
            val topics = data.db.from(Topics).select(Topics.id, Topics.name, Topics.otherNames, Topics.parentId)
                .where { parser.compileNameString(lastAddr, Topics) }
                .limit(0, queryLimit)
                .map { TopicItem(it[Topics.id]!!, it[Topics.name]!!, it[Topics.otherNames]!!, it[Topics.parentId]) }

            topicItemsPool.putAll(topics.map { it.id to it })

            topics.asSequence()
                .filter { isAddressMatches(it.parentId, address, address.size - 2) }
                .map { ElementTopic(it.id, it.name) }
                .toList()
        }.also {
            if(it.isEmpty()) {
                //查询结果为空时抛出无匹配警告
                collector.warning(ElementMatchesNone(metaValue.revertToQueryString()))
            }
        }
    }

    override fun findAuthor(metaValue: SingleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementAuthor> {
        if(metaValue.singleValue.value.isBlank()) {
            //元素内容为空时抛出空警告并直接返回
            collector.warning(BlankElement())
            return emptyList()
        }
        return authorCacheMap.computeIfAbsent(metaValue.singleValue) { metaString ->
            data.db.from(Authors).select(Authors.id, Authors.name)
                .where { parser.compileNameString(metaString, Authors) }
                .limit(0, queryLimit)
                .map { ElementAuthor(it[Authors.id]!!, it[Authors.name]!!) }
        }.also {
            if(it.isEmpty()) {
                //查询结果为空时抛出无匹配警告
                collector.warning(ElementMatchesNone(metaValue.singleValue.revertToQueryString()))
            }
        }
    }

    override fun findAnnotation(metaString: MetaString, metaType: Set<MetaType>, isForMeta: Boolean, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation> {
        if(metaString.value.isBlank()) {
            //元素内容为空时抛出空警告并直接返回
            collector.warning(BlankElement())
            return emptyList()
        }
        return annotationCacheMap.computeIfAbsent(annotationKeyOf(metaString, metaType)) {
            data.db.from(Annotations).select()
                .whereWithConditions {
                    it += if(metaString.precise) {
                        Annotations.name eq metaString.value
                    } else {
                        Annotations.name like parser.mapMatchToSqlLike(metaString.value)
                    }
                    //移除了在注解查询阶段对注解前缀类型的过滤。一是这个步骤在实现阶段有实现保证，这里顶多优化；二是提前过滤会引起疑惑，显得有注解莫名其妙没查询到
                }
                .limit(0, queryLimit)
                .map { Annotations.createEntity(it) }
        }.let { annotations ->
            if(annotations.isEmpty()) {
                //查询结果为空时抛出无匹配警告
                collector.warning(ElementMatchesNone(metaString.revertToQueryString()))
                emptyList()
            }else if(!isForMeta) {
                val result = annotations.filter { it.canBeExported }.map { ElementAnnotation(it.id, it.name) }
                if(result.isEmpty()) {
                    //如果canBeExported的结果为空，那么提出警告
                    collector.warning(ElementCannotBeExported(metaString.revertToQueryString()))
                    emptyList()
                }else{
                    result
                }
            }else{
                //区分forMeta时的情况。当forMeta时，不需要canBeExported检查，可以直接输出
                annotations.map { ElementAnnotation(it.id, it.name) }
            }
        }
    }

    internal fun flushCacheOf(cacheType: QueryManager.CacheType) {
        when (cacheType) {
            QueryManager.CacheType.AUTHOR -> {
                authorCacheMap.clear()
            }
            QueryManager.CacheType.TOPIC -> {
                topicCacheMap.clear()
                topicItemsPool.clear()
            }
            QueryManager.CacheType.TAG -> {
                tagItemsPool.clear()
                tagChildrenPool.clear()
                tagByStringPool.clear()
            }
            QueryManager.CacheType.ANNOTATION -> {
                annotationCacheMap.clear()
            }
        }
    }

    /**
     * 缓存topic查询的最终结果。
     */
    private val topicCacheMap = ConcurrentHashMap<MetaAddress, List<ElementTopic>>()

    /**
     * 缓存authot查询的最终结果。
     */
    private val authorCacheMap = ConcurrentHashMap<MetaString, List<ElementAuthor>>()

    /**
     * 缓存annotation查询的最终结果。
     */
    private val annotationCacheMap = ConcurrentHashMap<AnnotationCacheKey, List<Annotation>>()

    /**
     * 在parent溯源中缓存每一个遇到的topic。
     */
    private val topicItemsPool = ConcurrentHashMap<Int, TopicItem>()

    /**
     * 在parent溯源中缓存每一个遇到的tag。
     */
    private val tagItemsPool = ConcurrentHashMap<Int, TagItem>()

    /**
     * 缓存group tag的children tag。
     */
    private val tagChildrenPool = ConcurrentHashMap<Int, List<TagItem>>()

    /**
     * 缓存根据metaString查找到的tag。
     */
    private val tagByStringPool = ConcurrentHashMap<MetaString, List<TagItem>>()

    internal interface ItemInterface {
        val name: String
        val otherNames: List<String>
    }

    private data class TopicItem(val id: Int, override val name: String, override val otherNames: List<String>, val parentId: Int?) : ItemInterface

    private data class TagItem(val id: Int, override val name: String, override val otherNames: List<String>, val parentId: Int?, val type: Tag.Type, val isGroup: Tag.IsGroup, val color: String?) : ItemInterface

    private data class AnnotationCacheKey(val precise: Boolean, val value: String, val exportedFromAuthor: Boolean, val exportedFromTopic: Boolean, val exportedFromTag: Boolean)

    private fun annotationKeyOf(metaString: MetaString, metaType: Set<MetaType>): AnnotationCacheKey {
        return AnnotationCacheKey(metaString.precise, metaString.value, exportedFromAuthor = MetaType.AUTHOR in metaType, exportedFromTopic = MetaType.TOPIC in metaType, exportedFromTag = MetaType.TAG in metaType)
    }
}