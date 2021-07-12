package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import java.time.LocalDate

data class PartitionRes(val date: LocalDate, val count: Int)

data class PartitionFilter(@Limit val limit: Int,
                           @Offset val offset: Int,
                           val gte: LocalDate? = null,
                           val lt: LocalDate? = null)

data class PartitionMonthRes(val year: Int, val month: Int, val dayCount: Int, val count: Int)