package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.library.form.Search
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class TopicRes(val id: Int, val name: String,
                    val type: Topic.Type, val favorite: Boolean,
                    val annotations: List<Topic.CachedAnnotation>,
                    val score: Int?, val count: Int)

data class TopicDetailRes(val id: Int, val name: String, val parent: Parent?,
                          val otherNames: List<String>, val description: String,
                          val type: Topic.Type, val favorite: Boolean,
                          val annotations: List<Topic.CachedAnnotation>,
                          val links: List<Topic.Link>,
                          val score: Int?, val count: Int) {
    data class Parent(val id: Int, val name: String, val type: Topic.Type)
}

data class TopicFilter(@Limit val limit: Int,
                       @Offset val offset: Int,
                       @Search val ql: String?,
                       @Order(options = ["id", "name", "score", "count"])
                       val order: List<OrderItem> = listOf(OrderItem("id", desc = false)),
                       val type: Topic.Type? = null,
                       val favorite: Boolean? = null,
                       val parentId: Int? = null)

data class TopicCreateForm(val name: String,
                           val otherNames: List<String>? = null,
                           val parentId: Int? = null,
                           val type: Topic.Type = Topic.Type.UNKNOWN,
                           val description: String = "",
                           val links: List<Topic.Link>? = null,
                           val annotations: List<Any>? = null,
                           val favorite: Boolean = false,
                           val score: Int? = null)

data class TopicUpdateForm(val name: Opt<String>,
                           val otherNames: Opt<List<String>?>,
                           val parentId: Opt<Int?>,
                           val type: Opt<Topic.Type>,
                           val description: Opt<String>,
                           val links: Opt<List<Topic.Link>?>,
                           val annotations: Opt<List<Any>?>,
                           val favorite: Opt<Boolean>,
                           val score: Opt<Int?>)

fun newTopicRes(topic: Topic) = TopicRes(topic.id, topic.name, topic.type, topic.favorite, topic.cachedAnnotations ?: emptyList(), topic.exportedScore, topic.cachedCount)

fun newTopicDetailRes(topic: Topic, parent: Topic?) = TopicDetailRes(topic.id, topic.name,
    parent?.let { TopicDetailRes.Parent(it.id, it.name, it.type) },
    topic.otherNames, topic.description, topic.type, topic.favorite,
    topic.cachedAnnotations ?: emptyList(),
    topic.links ?: emptyList(),
    topic.score, topic.cachedCount)