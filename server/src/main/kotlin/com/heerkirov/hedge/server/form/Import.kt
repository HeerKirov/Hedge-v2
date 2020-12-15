package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.model.ImportImage
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.io.InputStream
import java.time.LocalDate
import java.time.LocalDateTime

data class ImportImageRes(val id: Int, val file: String, val thumbnailFile: String?)

data class ImportImageDetailRes(val id: Int,
                                val file: String, val thumbnailFile: String?,
                                val fileName: String?, val filePath: String?,
                                val fileCreateTime: LocalDateTime?, val fileUpdateTime: LocalDateTime?, val fileImportTime: LocalDateTime,
                                val tagme: Illust.Tagme,
                                val source: String?, val sourceId: Long?, val sourcePart: Int?,
                                val partitionTime: LocalDate, val orderTime: LocalDateTime, val createTime: LocalDateTime,
                                val actions: List<ImportImage.Action>)

data class ImportFilter(@Limit val limit: Int,
                        @Offset val offset: Int,
                        @Order(options = ["id", "fileCreateTime", "fileUpdateTime", "fileImportTime", "orderTime"])
                        val order: List<OrderItem> = listOf(OrderItem("id", desc = false)))

data class ImportForm(val filepath: String,
                      val removeOriginFile: Boolean = false)

data class UploadForm(val content: InputStream,
                      val filename: String,
                      val extension: String)

class ImportUpdateForm()

class FindDuplicateForm()

class AnalyseSourceForm()

class GenerateTimeForm()

class GenerateActionForm()