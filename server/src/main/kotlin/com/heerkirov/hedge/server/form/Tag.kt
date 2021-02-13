package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Length
import com.heerkirov.hedge.server.library.form.Min
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class TagRes(val id: Int, val ordinal: Int, val parentId: Int?,
                  val name: String, val otherNames: List<String>,
                  val type: Tag.Type, val group: Tag.IsGroup, val color: String?)

data class TagSimpleRes(val id: Int, val name: String, val color: String?, val isExported: Boolean)

data class TagTreeNode(val id: Int, val name: String, val otherNames: List<String>,
                       val type: Tag.Type, val group: Tag.IsGroup, val color: String?,
                       val children: List<TagTreeNode>?)

data class TagDetailRes(val id: Int, val ordinal: Int, val parentId: Int?,
                        val name: String, val otherNames: List<String>,
                        val type: Tag.Type, val group: Tag.IsGroup, val links: List<Int>,
                        val description: String, val color: String?,
                        val examples: List<IllustSimpleRes>, val annotations: List<Annotation>,
                        val score: Int?, val count: Int) {
    data class Annotation(val id: Int, val name: String, val canBeExported: Boolean)
}

data class TagFilter(@Limit val limit: Int,
                     @Offset val offset: Int,
                     @Search val search: String?,
                     @Order(options = ["id", "ordinal", "name", "createTime", "updateTime"])
                     val order: List<OrderItem>? = null,
                     val parent: Int? = null,
                     val type: Tag.Type? = null,
                     val group: Boolean? = null)

data class TagTreeFilter(val parent: Int? = null)

data class TagCreateForm(@NotBlank @Length(32) val name: String,
                         val otherNames: List<String>? = null,
                         @Min(0) val ordinal: Int? = null,
                         val parentId: Int?,
                         val type: Tag.Type,
                         val group: Tag.IsGroup = Tag.IsGroup.NO,
                         val links: List<Int>? = null,
                         val annotations: List<Any>? = null,
                         val description: String = "",
                         val color: String? = null,
                         val examples: List<Int>? = null)

data class TagUpdateForm(@NotBlank @Length(32) val name: Opt<String>,
                         val otherNames: Opt<List<String>?>,
                         @Min(0) val ordinal: Opt<Int>,
                         val parentId: Opt<Int?>,
                         val type: Opt<Tag.Type>,
                         val group: Opt<Tag.IsGroup>,
                         val links: Opt<List<Int>?>,
                         val annotations: Opt<List<Any>?>,
                         val description: Opt<String>,
                         val color: Opt<String>,
                         val examples: Opt<List<Int>?>)

fun newTagRes(tag: Tag) = TagRes(tag.id, tag.ordinal, tag.parentId, tag.name, tag.otherNames, tag.type, tag.isGroup, tag.color)

fun newTagTreeNode(tag: Tag, children: List<TagTreeNode>?) = TagTreeNode(tag.id, tag.name, tag.otherNames, tag.type, tag.isGroup, tag.color, children)

fun newTagDetailRes(tag: Tag, annotations: List<TagDetailRes.Annotation>, examples: List<IllustSimpleRes>) = TagDetailRes(tag.id, tag.ordinal, tag.parentId,
    tag.name, tag.otherNames,
    tag.type, tag.isGroup, tag.links ?: emptyList(), tag.description, tag.color,
    examples, annotations,
    tag.exportedScore, tag.cachedCount)
