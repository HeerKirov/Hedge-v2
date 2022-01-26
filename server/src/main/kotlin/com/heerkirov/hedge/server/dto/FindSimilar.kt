package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.model.system.FindSimilarResult
import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDate
import java.time.LocalDateTime

data class FindSimilarTaskRes(val id: Int, val selector: FindSimilarTask.TaskSelector, val config: FindSimilarTask.TaskConfig?, val recordTime: LocalDateTime)

data class FindSimilarResultRes(val id: Int, val imageIds: List<Int>, val recordTime: LocalDateTime)

data class FindSimilarTaskQueryFilter(@Limit val limit: Int,
                                      @Offset val offset: Int,
                                      @Order(options = ["id", "recordTime"])
                                      val order: List<OrderItem>? = null)

data class FindSimilarResultQueryFilter(@Limit val limit: Int,
                                        @Offset val offset: Int,
                                        @Order(options = ["id", "orderedId", "recordTime"])
                                        val order: List<OrderItem>? = null)

data class FindSimilarTaskCreateForm(val selector: FindSimilarTask.TaskSelector,
                                     val config: FindSimilarTask.TaskConfig? = null)

fun newFindSimilarTaskRes(task: FindSimilarTask) = FindSimilarTaskRes(task.id, task.selector, task.config, task.recordTime)

fun newFindSimilarResultRes(result: FindSimilarResult) = FindSimilarResultRes(result.id, result.imageIds, result.recordTime)