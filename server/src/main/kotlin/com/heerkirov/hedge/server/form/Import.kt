package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.exceptions.BaseException
import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.types.Opt
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
                                val partitionTime: LocalDate, val orderTime: LocalDateTime, val createTime: LocalDateTime)

data class AnalyseMetaRes(/** 本次解析的总目标记录数 */val total: Int,
                          /** 成功解析出source meta数据的记录数*/val succeed: Int,
                          /** 未解析出source meta数据(结果为null)的记录数。这些记录不会变更结果 */val failed: Int,
                          /** 解析过程中发生的错误警告。错误警告通常是解析配置有问题。 */val warnings: List<ErrorResult>)

data class ImportFilter(@Limit val limit: Int,
                        @Offset val offset: Int,
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

class ImportBatchUpdateForm(val target: List<Int>,
                            val tagme: Opt<Illust.Tagme>,
                            val setCreateTimeBy: Opt<ImportOption.TimeType>,
                            val setOrderTimeBy: Opt<ImportOption.TimeType>,
                            val partitionTime: Opt<LocalDate>)

class AnalyseMetaForm(val target: List<Int>? = null)
