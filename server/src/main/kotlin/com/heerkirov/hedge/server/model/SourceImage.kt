package com.heerkirov.hedge.server.model

import java.time.LocalDateTime

/**
 * 来源信息。
 * 分离存储illust关联的来源信息，与image类型的illust 1:1存储。
 */
data class SourceImage(/**
                        * 来源网站的代号。
                        */
                       val source: String,
                       /**
                        * 来源网站中的图像id。
                        */
                       val sourceId: Long,
                       /**
                        * 来源网站中的二级图像id，有些会有，比如pixiv。来源网站没有这个信息时，写0。
                        */
                       val sourcePart: Int = 0,
                       /**
                        * 原数据的标题信息，有些会有，比如pixiv。
                        */
                       val title: String? = null,
                       /**
                        * 原数据的描述信息，有些会有，比如pixiv。
                        */
                       val description: String? = null,
                       /**
                        * 原数据的标签信息。
                        */
                       val tags: List<SourceTag>? = null,
                       /**
                        * 原数据的关系信息。
                        */
                       val relations: SourceRelation? = null,
                       /**
                        * 原数据的解析状态。
                        */
                       val analyseStatus: AnalyseStatus = AnalyseStatus.NO,
                       /**
                        * 原数据被解析的时间。
                        */
                       val analyseTime: LocalDateTime? = null) {
    enum class AnalyseStatus {
        /**
         * 未解析。
         */
        NO,
        /**
         * 已解析。
         */
        ANALYZED,
        /**
         * 解析发生错误，多为网络错误，可重试。
         */
        ERROR,
        /**
         * 信息已手动处理。
         */
        MANUAL,
        /**
         * 解析找不到目标。
         */
        NOT_FOUND
    }

    data class SourceTag(val type: String, val name: String, val displayName: String?)
    data class SourceRelation(val pools: List<String>?, val parents: List<Int>?, val children: List<Int>?)
}