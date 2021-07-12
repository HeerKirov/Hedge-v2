package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDateTime

data class FolderRes(val id: Int, val title: String,
                     val isVirtualFolder: Boolean, val imageCount: Int?,
                     val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class FolderDetailRes(val id: Int, val title: String,
                           val isVirtualFolder: Boolean, val virtualQueryLanguage: String?, val imageCount: Int?,
                           val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class FolderPinRes(val id: Int, val title: String, val isVirtualFolder: Boolean)

data class FolderImageRes(val ordinal: Int?, val id: Int, val file: String, val thumbnailFile: String?,
                          val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                          val orderTime: LocalDateTime)

data class FolderFilter(@Limit val limit: Int,
                        @Offset val offset: Int,
                        @Order(options = ["id", "title", "createTime", "updateTime"])
                        val order: List<OrderItem> = listOf(OrderItem("title", desc = false)),
                        val isVirtualFolder: Boolean? = null,
                        val search: String? = null)

data class FolderImagesFilter(@Limit val limit: Int,
                              @Offset val offset: Int,
                              @Order(options = ["id", "score", "ordinal", "orderTime", "createTime", "updateTime"])
                              val order: List<OrderItem> = listOf(OrderItem("ordinal", desc = false)),
                              val favorite: Boolean? = null)

data class FolderCreateForm(@NotBlank val title: String,
                            val isVirtualFolder: Boolean,
                            @NotBlank val virtualQueryLanguage: String? = null,
                            val images: List<Int>? = null)

data class FolderUpdateForm(@NotBlank val title: Opt<String>,
                            val virtualQueryLanguage: Opt<String>)

data class FolderImagesPartialUpdateForm(val action: BatchAction,
                                         /** 添加新的image，指定其id */
                                         val images: List<Int>? = null,
                                         /** 修改或删除这些ordinal的项 */
                                         val itemIndexes: List<Int>? = null,
                                         /** 添加或移动项到这个位置 */
                                         val ordinal: Int? = null)

data class FolderPinForm(val ordinal: Int? = null)