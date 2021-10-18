package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.meta.Author
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem

data class AuthorRes(val id: Int, val name: String, val otherNames: List<String>, val keywords: List<String>,
                     val type: Author.Type, val favorite: Boolean,
                     val annotations: List<Author.CachedAnnotation>,
                     val score: Int?, val count: Int, val color: String?)

data class AuthorSimpleRes(val id: Int, val name: String, val type: Author.Type, val isExported: Boolean, val color: String?)

data class AuthorDetailRes(val id: Int, val name: String, val otherNames: List<String>, val keywords: List<String>, val description: String,
                           val type: Author.Type, val favorite: Boolean,
                           val annotations: List<Author.CachedAnnotation>,
                           val links: List<Author.Link>,
                           val score: Int?, val count: Int, val color: String?,
                           val mappingSourceTags: List<SourceMappingMetaItem>)

data class AuthorFilter(@Limit val limit: Int,
                        @Offset val offset: Int,
                        @Search val search: String?,
                        @Order(options = ["id", "name", "score", "count", "createTime", "updateTime"])
                        val order: List<OrderItem>? = null,
                        val type: Author.Type? = null,
                        val favorite: Boolean? = null,
                        val annotationIds: List<Int>? = null)

data class AuthorCreateForm(@NotBlank val name: String,
                            val otherNames: List<String>? = null,
                            val type: Author.Type = Author.Type.UNKNOWN,
                            val keywords: List<String>? = null,
                            val description: String = "",
                            val links: List<Author.Link>? = null,
                            val annotations: List<Any>? = null,
                            val favorite: Boolean = false,
                            val score: Int? = null,
                            val mappingSourceTags: List<SourceMappingMetaItem>? = null)

data class AuthorUpdateForm(@NotBlank val name: Opt<String>,
                            val otherNames: Opt<List<String>?>,
                            val type: Opt<Author.Type>,
                            val keywords: Opt<List<String>?>,
                            val description: Opt<String>,
                            val links: Opt<List<Author.Link>?>,
                            val annotations: Opt<List<Any>?>,
                            val favorite: Opt<Boolean>,
                            val score: Opt<Int?>,
                            val mappingSourceTags: Opt<List<SourceMappingMetaItem>?>)

fun newAuthorRes(author: Author, colors: Map<Author.Type, String>) = AuthorRes(author.id, author.name,
    author.otherNames, author.keywords, author.type, author.favorite,
    author.cachedAnnotations ?: emptyList(), author.score, author.cachedCount, colors[author.type])

fun newAuthorDetailRes(author: Author, colors: Map<Author.Type, String>, mappingSourceTags: List<SourceMappingMetaItem>) = AuthorDetailRes(
    author.id, author.name, author.otherNames, author.keywords, author.description, author.type, author.favorite,
    author.cachedAnnotations ?: emptyList(), author.links ?: emptyList(),
    author.score, author.cachedCount, colors[author.type], mappingSourceTags)