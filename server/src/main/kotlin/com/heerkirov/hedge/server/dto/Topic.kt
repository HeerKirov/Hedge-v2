package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.tuples.Tuple3
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class TopicRes(val id: Int, val name: String, val parentRoot: TopicParent?, val parentId: Int?,
                    val otherNames: List<String>, val keywords: List<String>,
                    val type: Topic.Type, val favorite: Boolean,
                    val annotations: List<Topic.CachedAnnotation>,
                    val score: Int?, val count: Int, val color: String?)

data class TopicSimpleRes(val id: Int, val name: String, val type: Topic.Type, val isExported: Boolean, val color: String?)

data class TopicDetailRes(val id: Int, val name: String, val parentRoot: TopicParent?, val parentId: Int?, val parents: List<TopicParent>, val children: List<TopicChildrenNode>?,
                          val otherNames: List<String>, val keywords: List<String>, val description: String,
                          val type: Topic.Type, val favorite: Boolean,
                          val annotations: List<Topic.CachedAnnotation>,
                          val links: List<Topic.Link>,
                          val score: Int?, val count: Int, val color: String?,
                          val mappingSourceTags: List<SourceMappingMetaItem>)

data class TopicParent(val id: Int, val name: String, val type: Topic.Type, val color: String?)

data class TopicChildrenNode(val id: Int, val name: String, val type: Topic.Type, val color: String?, val children: List<TopicChildrenNode>?)

data class TopicFilter(@Limit val limit: Int,
                       @Offset val offset: Int,
                       @Search val query: String?,
                       @Order(options = ["id", "name", "score", "count", "createTime", "updateTime"])
                       val order: List<OrderItem>? = null,
                       val type: Topic.Type? = null,
                       val favorite: Boolean? = null,
                       val parentId: Int? = null,
                       val annotationIds: List<Int>? = null)

data class TopicCreateForm(@NotBlank val name: String,
                           val otherNames: List<String>? = null,
                           val parentId: Int? = null,
                           val type: Topic.Type = Topic.Type.UNKNOWN,
                           val keywords: List<String>? = null,
                           val description: String = "",
                           val links: List<Topic.Link>? = null,
                           val annotations: List<Any>? = null,
                           val favorite: Boolean = false,
                           val score: Int? = null,
                           val mappingSourceTags: List<SourceMappingMetaItemForm>? = null)

data class TopicUpdateForm(@NotBlank val name: Opt<String>,
                           val otherNames: Opt<List<String>?>,
                           val parentId: Opt<Int?>,
                           val type: Opt<Topic.Type>,
                           val keywords: Opt<List<String>?>,
                           val description: Opt<String>,
                           val links: Opt<List<Topic.Link>?>,
                           val annotations: Opt<List<Any>?>,
                           val favorite: Opt<Boolean>,
                           val score: Opt<Int?>,
                           val mappingSourceTags: Opt<List<SourceMappingMetaItemForm>?>)

fun newTopicRes(topic: Topic, rootTopic: Tuple3<Int, String, Topic.Type>?, colors: Map<Topic.Type, String>) = TopicRes(topic.id, topic.name,
    rootTopic?.let { (id, name, type) -> TopicParent(id, name, type, colors[type]) }, topic.parentId,
    topic.otherNames, topic.keywords, topic.type, topic.favorite,
    topic.cachedAnnotations ?: emptyList(),
    topic.score, topic.cachedCount, colors[topic.type])

fun newTopicDetailRes(topic: Topic, parents: List<Topic>, children: List<TopicChildrenNode>?, colors: Map<Topic.Type, String>, mappingSourceTags: List<SourceMappingMetaItem>) = TopicDetailRes(
    topic.id, topic.name,
    parents.firstOrNull { it.id == topic.parentRootId }?.let { TopicParent(it.id, it.name, it.type, colors[it.type]) }, topic.parentId,
    parents.map { TopicParent(it.id, it.name, it.type, colors[it.type]) }, children,
    topic.otherNames, topic.keywords, topic.description, topic.type, topic.favorite,
    topic.cachedAnnotations ?: emptyList(), topic.links ?: emptyList(),
    topic.score, topic.cachedCount, colors[topic.type], mappingSourceTags)