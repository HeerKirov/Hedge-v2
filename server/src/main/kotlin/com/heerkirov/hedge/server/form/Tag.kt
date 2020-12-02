package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Length
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.model.Tag
import com.heerkirov.hedge.server.utils.Opt

data class TagRes(val id: Int, val ordinal: Int, val parentId: Int?,
                  val name: String, val otherNames: List<String>?,
                  val type: Tag.Type, val group: Tag.IsGroup)

data class TagTreeNode(val id: Int, val name: String, val otherNames: List<String>?,
                       val type: Tag.Type, val group: Tag.IsGroup,
                       val children: List<TagTreeNode>?)

data class TagDetailRes(val id: Int, val ordinal: Int, val parentId: Int?,
                        val name: String, val otherNames: List<String>?,
                        val type: Tag.Type, val group: Tag.IsGroup, val links: List<Int>?,
                        val description: String, val examples: List<Example>?,
                        val score: Int?, val count: Int) {
    //TODO 完成illust之后，补全example的字段
    data class Example(val id: Int)
}

data class TagCreateForm(@NotBlank @Length(32) val name: String,
                         val otherNames: List<String>? = null,
                         val ordinal: Int? = null,
                         val parentId: Int?,
                         val type: Tag.Type,
                         val group: Tag.IsGroup = Tag.IsGroup.NO,
                         val links: List<Int>? = null,
                         val description: String = "",
                         val examples: List<Int>? = null)

data class TagUpdateForm(@NotBlank @Length(32) val name: Opt<String>,
                         val otherNames: Opt<List<String>?>,
                         val ordinal: Opt<Int>,
                         val parentId: Opt<Int?>,
                         val type: Opt<Tag.Type>,
                         val group: Opt<Tag.IsGroup>,
                         val links: Opt<List<Int>?>,
                         val description: Opt<String>,
                         val examples: Opt<List<Int>?>)

fun newTagRes(it: Tag) = TagRes(it.id, it.ordinal, it.parentId, it.name, it.otherNames.takeIf { i -> i.isNotEmpty() }, it.type, it.isGroup)

fun newTagTreeNode(it: Tag, children: List<TagTreeNode>?) = TagTreeNode(it.id, it.name, it.otherNames.takeIf { i -> i.isNotEmpty() }, it.type, it.isGroup, children)

fun newTagDetailRes(it: Tag) = TagDetailRes(it.id, it.ordinal, it.parentId,
    it.name, it.otherNames.takeIf { i -> i.isNotEmpty() },
    it.type, it.isGroup, it.links, it.description,
    it.examples?.map { i -> TagDetailRes.Example(i) }, it.exportedScore, it.cachedCount)
