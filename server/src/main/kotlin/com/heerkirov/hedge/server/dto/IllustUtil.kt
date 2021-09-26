package com.heerkirov.hedge.server.dto

import java.time.LocalDateTime

data class CollectionSituationRes(val id: Int, val childrenCount: Int, val orderTime: LocalDateTime,
                                  val childrenExamples: List<IllustSimpleRes>,
                                  val belongs: List<Int>)