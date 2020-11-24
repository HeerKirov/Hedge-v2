package com.heerkirov.hedge.server.model

import java.time.LocalDate

/**
 * 时间分区。
 * 这个模型整体是为了冗余而设。
 */
data class Partition(val id: Int?,
                     /**
                      * 此时间分区的时间。
                      */
                     val date: LocalDate,
                     /**
                      * [cache field]此时间分区包含的项的总数。
                      */
                     val cachedCount: Int = 0)