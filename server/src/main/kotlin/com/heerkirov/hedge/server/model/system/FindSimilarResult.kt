package com.heerkirov.hedge.server.model.system

import java.time.LocalDateTime

data class FindSimilarResult(val id: Int,
                             /**
                              * 此result的类型。
                              */
                             val type: Type,
                             /**
                              * 此待处理结果包含的所有image ids。用于id搜索。
                              */
                             val imageIds: List<Int>,
                             /**
                              * 用于排序的id。它是imageIds中最大的那一个。
                              */
                             val ordered: Int,
                             /**
                              * 此记录创建的时间。
                              */
                             val recordTime: LocalDateTime) {
    enum class Type {
        DUPLICATED,
        OTHERS
    }
}