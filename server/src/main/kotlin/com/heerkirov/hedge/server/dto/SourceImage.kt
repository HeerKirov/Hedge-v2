package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.library.form.Search
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.io.InputStream
import java.time.LocalDateTime

data class SourceImageRes(val source: String, val sourceTitle: String, val sourceId: Long,
                          val tagCount: Int, val poolCount: Int, val relationCount: Int,
                          val empty: Boolean, val status: SourceImage.Status,
                          val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class SourceImageDetailRes(val source: String, val sourceTitle: String, val sourceId: Long,
                                val title: String, val description: String, val tags: List<SourceTagDto>,
                                val pools: List<SourcePoolDto>, val relations: List<Int>,
                                val empty: Boolean, val status: SourceImage.Status,
                                val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class SourceTagDto(val name: String, val displayName: String?, val type: String?)

data class SourcePoolDto(val key: String, val title: String)

data class SourceImageQueryFilter(@Limit val limit: Int,
                                  @Offset val offset: Int,
                                  @Search val query: String?,
                                  @Order(options = ["rowId", "sourceId", "source", "createTime", "updateTime"])
                                  val order: List<OrderItem>? = null,
                                  val source: String? = null,
                                  val sourceTag: String? = null,
                                  val imageId: Int? = null)

data class SourceImageBulkForm(val items: List<SourceImageCreateForm>)

data class SourceImageCreateForm(val source: String, val sourceId: Long, val status: Opt<SourceImage.Status>,
                                 val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceTagForm>>,
                                 val pools: Opt<List<SourcePoolForm>>, val relations: Opt<List<Int>>)

data class SourceImageUpdateForm(val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceTagForm>>,
                                 val pools: Opt<List<SourcePoolForm>>, val relations: Opt<List<Int>>, val status: Opt<SourceImage.Status>)

data class SourceTagForm(val name: String, val displayName: Opt<String?>, val type: Opt<String?>)

data class SourcePoolForm(val key: String, val title: Opt<String>)