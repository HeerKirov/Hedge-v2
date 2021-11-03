package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.*
import com.heerkirov.hedge.server.model.collection.Folder
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDateTime

data class FolderTreeNode(val id: Int, val title: String, val type: Folder.FolderType,
                          val query: String?, val imageCount: Int?,
                          val createTime: LocalDateTime, val updateTime: LocalDateTime,
                          val children: List<FolderTreeNode>?)

data class FolderRes(val id: Int, val title: String, val parentId: Int?, val parentAddress: List<String>,
                     val type: Folder.FolderType, val query: String?, val imageCount: Int?,
                     val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class FolderSimpleRes(val id: Int, val address: List<String>, val type: Folder.FolderType)

data class FolderImageRes(val id: Int, val ordinal: Int, val file: String, val thumbnailFile: String,
                          val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                          val orderTime: LocalDateTime)

data class FolderQueryFilter(@Limit val limit: Int,
                             @Offset val offset: Int,
                             @Order(options = ["id", "ordinal", "title", "createTime", "updateTime"])
                             val order: List<OrderItem>? = null,
                             val search: String? = null)

data class FolderTreeFilter(val parent: Int? = null)

data class FolderImagesFilter(@Limit val limit: Int,
                              @Offset val offset: Int,
                              @Order(options = ["id", "score", "ordinal", "orderTime", "createTime", "updateTime"])
                              val order: List<OrderItem>? = null,
                              val favorite: Boolean? = null)

data class FolderCreateForm(@NotBlank val title: String,
                            val type: Folder.FolderType,
                            val parentId: Int? = null,
                            @Min(0) val ordinal: Int? = null,
                            val images: List<Int>? = null,
                            @NotBlank val query: String? = null)

data class FolderUpdateForm(@NotBlank val title: Opt<String>,
                            @NotBlank val query: Opt<String>,
                            val parentId: Opt<Int?>,
                            @Min(0) val ordinal: Opt<Int>)

data class FolderImagesPartialUpdateForm(val action: BatchAction,
                                         /** 添加新的images/移动或删除images，指定其id */
                                         val images: List<Int>? = null,
                                         /** 添加或移动项到这个位置 */
                                         val ordinal: Int? = null)

data class FolderPinForm(val ordinal: Int? = null)