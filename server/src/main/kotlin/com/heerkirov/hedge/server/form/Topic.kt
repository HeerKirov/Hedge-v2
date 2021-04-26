package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class TopicRes(val id: Int, val name: String, val otherNames: List<String>, val keywords: List<String>,
                    val type: Topic.Type, val favorite: Boolean,
                    val annotations: List<Topic.CachedAnnotation>,
                    val score: Int?, val count: Int)

data class TopicSimpleRes(val id: Int, val name: String, val isExported: Boolean)

data class TopicDetailRes(val id: Int, val name: String, val parent: Parent?,
                          val otherNames: List<String>, val keywords: List<String>, val description: String,
                          val type: Topic.Type, val favorite: Boolean,
                          val annotations: List<Topic.CachedAnnotation>,
                          val links: List<Topic.Link>,
                          val score: Int?, val count: Int, val originScore: Int?) {
    data class Parent(val id: Int, val name: String, val type: Topic.Type)
}

data class TopicFilter(@Limit val limit: Int,
                       @Offset val offset: Int,
                       @Search val search: String?,
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
                           val score: Int? = null)

data class TopicUpdateForm(@NotBlank val name: Opt<String>,
                           val otherNames: Opt<List<String>?>,
                           val parentId: Opt<Int?>,
                           val type: Opt<Topic.Type>,
                           val keywords: Opt<List<String>?>,
                           val description: Opt<String>,
                           val links: Opt<List<Topic.Link>?>,
                           val annotations: Opt<List<Any>?>,
                           val favorite: Opt<Boolean>,
                           val score: Opt<Int?>)

fun newTopicRes(topic: Topic) = TopicRes(topic.id, topic.name, topic.otherNames, topic.keywords, topic.type, topic.favorite, topic.cachedAnnotations ?: emptyList(), topic.exportedScore, topic.cachedCount)

fun newTopicDetailRes(topic: Topic, parent: Topic?) = TopicDetailRes(topic.id, topic.name,
    parent?.let { TopicDetailRes.Parent(it.id, it.name, it.type) },
    topic.otherNames, topic.keywords, topic.description, topic.type, topic.favorite,
    topic.cachedAnnotations ?: emptyList(),
    topic.links ?: emptyList(),
    topic.score, topic.cachedCount, topic.score)