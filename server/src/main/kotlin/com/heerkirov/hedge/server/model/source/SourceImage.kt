package com.heerkirov.hedge.server.model.source

import java.time.LocalDateTime

/**
 * 来源信息。
 * 分离存储illust关联的来源信息，与image类型的illust 1:1存储。
 */
data class SourceImage(val id: Int,
                       /**
                        * 来源网站的代号。
                        */
                       val source: String,
                       /**
                        * 来源网站中的图像id。
                        */
                       val sourceId: Long,
                       /**
                        * 原数据的标题信息，有些会有，比如pixiv。
                        */
                       val title: String? = null,
                       /**
                        * 原数据的描述信息，有些会有，比如pixiv。
                        */
                       val description: String? = null,
                       /**
                        * 原数据的关系信息。
                        */
                       val relations: List<Int>? = null,
                       /**
                        * 原数据的集合所属信息。
                        */
                       val pools: List<String>? = null,
                       /**
                        * 关系信息的数量的缓存。
                        */
                       val cachedCount: SourceCount,
                       /**
                        * 内容是否为空的缓存标记。
                        */
                       val empty: Boolean,
                       /**
                        * 初次建立的真实时间。
                        */
                       val createTime: LocalDateTime,
                       /**
                        * 上次更新的真实更新时间。
                        */
                       val updateTime: LocalDateTime) {

    data class SourceCount(val tagCount: Int, val poolCount: Int, val relationCount: Int)
}