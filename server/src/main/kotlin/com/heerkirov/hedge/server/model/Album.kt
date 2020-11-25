package com.heerkirov.hedge.server.model

import java.time.LocalDateTime

/**
 * 画集。
 */
data class Album(val id: Int?,
                 /**
                  * 标题。
                  */
                 val title: String,
                 /**
                  * 描述。
                  */
                 val description: String = "",
                 /**
                  * 评分。
                  */
                 val score: Int? = null,
                 /**
                  * 喜爱标记。
                  */
                 val favorite: Boolean = false,
                 /**
                  * 子标题。
                  * 插入子标题会把画集的内容分割成段落。
                  */
                 val subtitles: List<Subtitle>? = null,
                 /**
                  * 记录创建的时间。
                  */
                 val createTime: LocalDateTime,
                 /**
                  * 画集的项发生更新的时间。
                  */
                 val updateTime: LocalDateTime) {

    data class Subtitle(
        /**
         * 指定在此ordinal的image前插入子标题，
         */
        val ordinal: Int,
        /**
         * 子标题名。
         */
        val title: String
    )
}