package com.heerkirov.hedge.server.model.meta

import java.time.LocalDateTime

/**
 * 作者标签。
 */
data class Author(val id: Int,
                  /**
                   * 标签名。
                   */
                  val name: String,
                  /**
                   * 其他名称。
                   */
                  val otherNames: List<String>,
                  /**
                   * 关键字。作用是一个更突出更简练的description。
                   */
                  val keywords: List<String>,
                  /**
                   * 分类。作者标签分为3类。
                   */
                  val type: Type,
                  /**
                   * 手动评分。
                   */
                  val score: Int? = null,
                  /**
                   * 喜爱标记。
                   */
                  val favorite: Boolean = false,
                  /**
                   * 此作者的相关链接。
                   */
                  val links: List<Link>? = null,
                  /**
                   * 描述。
                   */
                  val description: String = "",
                  /**
                   * [exported field]导出的评分。
                   */
                  val exportedScore: Int? = null,
                  /**
                   * [cache field]关联的image的数量。
                   */
                  val cachedCount: Int = 0,
                  /**
                   * [cache field]冗余存储关联的注解。在author列表中会用到，防止N+1查询。
                   */
                  val cachedAnnotations: List<CachedAnnotation>? = null,
                  /**
                   * 此标签创建的时间。
                   */
                  val createTime: LocalDateTime,
                  /**
                   * 此标签关联的image项上次发生更新的时间。
                   */
                  val updateTime: LocalDateTime) {
    enum class Type {
        /**
         * 未知类型。
         */
        UNKNOWN,
        /**
         * 画师。
         */
        ARTIST,
        /**
         * 工作室。
         */
        STUDIO,
        /**
         * 出版物。
         */
        PUBLISH
    }

    data class Link(val title: String?, val link: String)

    data class CachedAnnotation(val id: Int, val name: String)
}