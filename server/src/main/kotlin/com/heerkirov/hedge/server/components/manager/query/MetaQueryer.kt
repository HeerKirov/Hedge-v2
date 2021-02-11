package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.BlankElement
import com.heerkirov.hedge.server.library.compiler.translator.ElementMatchesNone
import com.heerkirov.hedge.server.library.compiler.translator.Queryer
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAnnotation
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAuthor
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTag
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTopic
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.ktorm.compositionContains
import com.heerkirov.hedge.server.utils.ktorm.escapeLike
import com.heerkirov.hedge.server.utils.ktorm.first
import me.liuwj.ktorm.dsl.*
import java.util.concurrent.ConcurrentHashMap

class MetaQueryer(private val data: DataRepository) : Queryer {
    private val parser = MetaQueryerParser()
    private val queryLimit get() = data.metadata.query.queryLimitOfQueryItems

    override fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag> {
        fun findRealTags(tagId: Int): List<ElementTag.RealTag> {
            TODO()
        }

        fun isAddressMatches(tagId: Int?, address: MetaAddress, nextAddr: Int): Boolean {
            //对address的处理方法：当address为A.B.C...M.N时，首先查找所有name match N的entity。
            //随后对于每一个entity，根据其parentId向上查找其所有父标签。当找到一个父标签满足一个地址段M时，就将要匹配的地址段向前推1(L, K, J, ..., C, B, A)。
            //如果address的每一节都被匹配，那么此entity符合条件；如果parent前推到了root依然没有匹配掉所有的address，那么不符合条件。
            return when {
                nextAddr < 0 -> true
                tagId == null -> false
                else -> {
                    val tag = tagItemsPool.computeIfAbsent(tagId) {
                        data.db.from(Tags).select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.color)
                            .where { Tags.id eq tagId }
                            .limit(0, 1)
                            .first()
                            .let { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.color]) }
                    }
                    isAddressMatches(tag.parentId, address, if(parser.isNameEqualOrMatch(address[nextAddr], tag)) { nextAddr - 1 }else{ nextAddr })
                }
            }
        }

        return when (metaValue) {
            is SimpleMetaValue -> {
                if(metaValue.value.any { it.value.isBlank() }) {
                    //元素内容为空时抛出空警告并直接返回
                    collector.warning(BlankElement())
                    return emptyList()
                }
                val tags = data.db.from(Tags).select(Tags.id, Tags.name, Tags.otherNames, Tags.parentId, Tags.type, Tags.color)
                    .where { parser.compileNameString(metaValue.value.last(), Tags) }
                    .limit(0, queryLimit)
                    .map { TagItem(it[Tags.id]!!, it[Tags.name]!!, it[Tags.otherNames]!!, it[Tags.parentId], it[Tags.type]!!, it[Tags.color]) }

                tagItemsPool.putAll(tags.map { it.id to it })

                tags.asSequence()
                    .filter { isAddressMatches(it.parentId, metaValue.value, metaValue.value.size - 2) }
                    .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                    .toList()
            }
            is SequentialMetaValueOfCollection -> TODO()
            is SequentialMetaValueOfRange -> TODO()
            is SequentialItemMetaValueToOther -> TODO()
            is SequentialItemMetaValueToDirection -> TODO()
            else -> throw RuntimeException("Unsupported metaValue type ${metaValue::class.simpleName}.")
        }.also {
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

    override fun findAnnotation(metaString: MetaString, metaType: Set<MetaType>, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation> {
        if(metaString.value.isBlank()) {
            //元素内容为空时抛出空警告并直接返回
            collector.warning(BlankElement())
            return emptyList()
        }
        return annotationCacheMap.computeIfAbsent(metaString) {
            data.db.from(Annotations).select(Annotations.id, Annotations.name)
                .whereWithConditions {
                    it += if(metaString.precise) {
                        Annotations.name eq metaString.value
                    } else {
                        Annotations.name like parser.mapMatchToSqlLike(metaString.value)
                    }
                    if(metaType.isNotEmpty()) {
                        it += Annotations.target compositionContains parser.mapMetaTypeToTarget(metaType)
                    }
                }
                .limit(0, queryLimit)
                .map { ElementAnnotation(it[Annotations.id]!!, it[Annotations.name]!!) }
        }.also {
            if(it.isEmpty()) {
                //查询结果为空时抛出无匹配警告
                collector.warning(ElementMatchesNone(metaString.revertToQueryString()))
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
    private val annotationCacheMap = ConcurrentHashMap<MetaString, List<ElementAnnotation>>()

    /**
     * 在parent溯源中缓存每一个遇到的topic。
     */
    private val topicItemsPool = ConcurrentHashMap<Int, TopicItem>()

    /**
     * 在parent溯源中缓存每一个遇到的tag。
     */
    private val tagItemsPool = ConcurrentHashMap<Int, TagItem>()

    internal interface ItemInterface {
        val name: String
        val otherNames: List<String>
    }
    private data class TopicItem(val id: Int, override val name: String, override val otherNames: List<String>, val parentId: Int?) : ItemInterface
    private data class TagItem(val id: Int, override val name: String, override val otherNames: List<String>, val parentId: Int?, val type: Tag.Type, val color: String?) : ItemInterface
}