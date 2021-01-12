package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.album.Album
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDateTime

data class AlbumRes(val id: Int, val title: String, val imageCount: Int,
                    val file: String?, val thumbnailFile: String?,
                    val score: Int?, val favorite: Boolean,
                    val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class AlbumSimpleRes(val id: Int, val title: String)

data class AlbumDetailRes(val id: Int, val title: String, val imageCount: Int, val file: String?,
                          val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>,
                          val description: String, val score: Int?, val favorite: Boolean,
                          val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class AlbumImageResult(val total: Int, val subtitles: List<Album.Subtitle>, val result: List<ImageItem>) {
    data class ImageItem(val id: Int, val ordinal: Int, val file: String, val thumbnailFile: String?,
                             val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                             val orderTime: LocalDateTime)
}

data class AlbumQueryFilter(@Limit val limit: Int,
                            @Offset val offset: Int,
                            @Order(options = ["id", "score", "createTime", "updateTime"])
                            val order: List<OrderItem> = listOf(OrderItem("orderTime", desc = false)),
                            val favorite: Boolean? = null,
                            val query: String? = null)

data class AlbumCreateForm(val title: String? = null,
                           val description: String? = null,
                           val images: List<Int> = emptyList(),
                           val subtitles: List<Album.Subtitle>? = null,
                           val score: Int? = null,
                           val favorite: Boolean = false)

data class AlbumUpdateForm(val title: Opt<String?>,
                           val description: Opt<String?>,
                           val score: Opt<Int?>,
                           val favorite: Opt<Boolean>,
                           val topics: Opt<List<Int>>, val authors: Opt<List<Int>>, val tags: Opt<List<Int>>)

data class AlbumImageUpdateForm(val images: List<Int>, val subtitles: List<Album.Subtitle>)

data class AlbumImagesPartialUpdateForm(val action: BatchAction,
                                        /** 添加新的image，指定其id */
                                        val images: List<Int>? = null,
                                        /** 添加新的子标题 */
                                        val subtitle: Album.Subtitle? = null,
                                        /** 修改或删除这些ordinal的项 */
                                        val itemIndexes: List<Int>? = null,
                                        /** 添加或移动项到这个位置 */
                                        val toOrdinal: Int? = null)