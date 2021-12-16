package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.library.form.Search
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.io.InputStream
import java.time.LocalDate
import java.time.LocalDateTime

data class ImportImageRes(val id: Int, val file: String, val thumbnailFile: String?,
                          val fileName: String?, val fileImportTime: LocalDateTime)

data class ImportImageDetailRes(val id: Int,
                                val file: String, val thumbnailFile: String?,
                                val fileName: String?, val filePath: String?, val fileFromSource: List<String>,
                                val fileCreateTime: LocalDateTime?, val fileUpdateTime: LocalDateTime?, val fileImportTime: LocalDateTime,
                                val tagme: Illust.Tagme,
                                val source: String?, val sourceId: Long?, val sourcePart: Int?,
                                val partitionTime: LocalDate, val orderTime: LocalDateTime, val createTime: LocalDateTime)

data class ImportSaveRes(val total: Int)

data class ImportFilter(@Limit val limit: Int,
                        @Offset val offset: Int,
                        @Search val search: String?,
                        @Order(options = ["id", "fileCreateTime", "fileUpdateTime", "fileImportTime", "orderTime"])
                        val order: List<OrderItem> = listOf(OrderItem("id", desc = false)))

data class ImportForm(val filepath: String,
                      val removeOriginFile: Boolean = false)

data class UploadForm(val content: InputStream,
                      val filename: String,
                      val extension: String)

class ImportUpdateForm(val tagme: Opt<Illust.Tagme>,
                       val source: Opt<String?>,
                       val sourceId: Opt<Long?>,
                       val sourcePart: Opt<Int?>,
                       val partitionTime: Opt<LocalDate>,
                       val orderTime: Opt<LocalDateTime>,
                       val createTime: Opt<LocalDateTime>)

class ImportBatchUpdateForm(val target: List<Int>? = null,
                            val tagme: Illust.Tagme? = null,
                            val setCreateTimeBy: ImportOption.TimeType? = null,
                            val setOrderTimeBy: ImportOption.TimeType? = null,
                            val partitionTime: LocalDate? = null,
                            val analyseSource: Boolean = false)
