package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.library.form.Search
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.io.InputStream
import java.time.LocalDateTime

data class SourceImageRes(val source: String, val sourceTitle: String, val sourceId: Long,
                          val tagCount: Int, val poolCount: Int, val relationCount: Int,
                          val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class SourceImageDetailRes(val source: String, val sourceTitle: String, val sourceId: Long,
                                val title: String, val description: String, val tags: List<SourceTagDto>,
                                val pools: List<String>, val children: List<Int>, val parents: List<Int>,
                                val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class SourceTagDto(val name: String, val displayName: String?, val type: String?)

data class SourceImageQueryFilter(@Limit val limit: Int,
                                  @Offset val offset: Int,
                                  @Search val query: String?,
                                  @Order(options = ["rowId", "sourceId", "source", "createTime", "updateTime"])
                                  val order: List<OrderItem>? = null,
                                  val source: String? = null,
                                  val sourceTag: String? = null,
                                  val imageId: Int? = null)

data class SourceImportForm(val filepath: String)

data class SourceUploadForm(val content: InputStream, val extension: String)

data class SourceUploadModel(val source: String, val sourceId: Long,
                             val title: String? = null, val description: String? = null, val tags: List<SourceTagDto>? = null,
                             val pools: List<String>? = null, val children: List<Int>? = null, val parents: List<Int>? = null)

data class SourceImageBulkCreateForm(val items: List<SourceImageCreateForm>)

data class SourceImageCreateForm(val source: String, val sourceId: Long,
                                 val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceTagDto>>,
                                 val pools: Opt<List<String>>, val children: Opt<List<Int>>, val parents: Opt<List<Int>>)

data class SourceImageUpdateForm(val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceTagDto>>,
                                 val pools: Opt<List<String>>, val children: Opt<List<Int>>, val parents: Opt<List<Int>>)