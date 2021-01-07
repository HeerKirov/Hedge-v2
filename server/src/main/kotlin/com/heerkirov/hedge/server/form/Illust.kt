package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDate
import java.time.LocalDateTime

data class IllustRes(val id: Int, val type: Illust.IllustType,
                     val file: String, val thumbnailFile: String?,
                     val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                     val orderTime: LocalDateTime)

data class IllustSimpleRes(val id: Int, val thumbnailFile: String?)

data class IllustDetailRes(val id: Int, val fileId: Int, val file: String,
                           val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>,
                           val description: String, val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                           val originDescription: String, val originScore: Int?,
                           val partitionTime: LocalDate, val orderTime: LocalDateTime, val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class IllustCollectionRelatedRes(val relations: List<IllustSimpleRes>)

data class IllustImageRelatedRes(val collection: IllustSimpleRes?,
                                 val relations: List<IllustSimpleRes>,
                                 val albums: List<AlbumSimpleRes>)

data class IllustImageOriginRes(val source: String?, val sourceTitle: String?, val sourceId: Long?, val sourcePart: Int?,
                                val title: String?, val description: String?,
                                val tags: List<SourceImage.SourceTag>?,
                                val pools: List<String>?, val children: List<Int>?, val parents: List<Int>?)

data class IllustQueryFilter(@Limit val limit: Int,
                             @Offset val offset: Int,
                             @Order(options = ["id", "orderTime", "createTime", "updateTime"])
                             val order: List<OrderItem> = listOf(OrderItem("orderTime", desc = false)),
                             val type: Illust.IllustType,
                             val partition: LocalDate? = null,
                             val query: String? = null)

data class IllustCollectionCreateForm(val images: List<Int>,
                                      val description: String? = null,
                                      val score: Int? = null,
                                      val favorite: Boolean = false,
                                      val tagme: Illust.Tagme = Illust.Tagme.EMPTY)

class IllustCollectionUpdateForm(val topics: Opt<List<Int>>, val authors: Opt<List<Int>>, val tags: Opt<List<Int>>,
                                 val description: Opt<String?>, val score: Opt<Int?>, val favorite: Opt<Boolean>, val tagme: Opt<Illust.Tagme>)

class IllustCollectionRelatedUpdateForm(val relations: List<Int>)

class IllustImageUpdateForm(val topics: Opt<List<Int>>, val authors: Opt<List<Int>>, val tags: Opt<List<Int>>,
                            val description: Opt<String?>, val score: Opt<Int?>, val favorite: Opt<Boolean>, val tagme: Opt<Illust.Tagme>,
                            val partitionTime: Opt<LocalDate>, val orderTime: Opt<LocalDateTime>)

class IllustImageRelatedUpdateForm(val relations: Opt<List<Int>>, val collectionId: Opt<Int?>)

class IllustImageOriginUpdateForm(val source: Opt<String?>, val sourceId: Opt<Long?>, val sourcePart: Opt<Int?>,
                                  val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceImage.SourceTag>>,
                                  val pools: Opt<List<String>>, val children: Opt<List<Int>>, val parents: Opt<List<Int>>)