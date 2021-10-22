package com.heerkirov.hedge.server.dto

import java.time.LocalDate

data class PartitionRes(val date: LocalDate, val count: Int)

data class PartitionFilter(val gte: LocalDate? = null,
                           val lt: LocalDate? = null)

data class PartitionMonthRes(val year: Int, val month: Int, val dayCount: Int, val count: Int)