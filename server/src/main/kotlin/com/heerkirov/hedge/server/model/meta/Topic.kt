package com.heerkirov.hedge.server.model.meta

import java.time.LocalDateTime

/**
 * 主题标签。
 */
data class Topic(val id: Int,
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
                  * 父标签的id。
                  * 可行的父子关系有：
                  * copyright的父标签：copyright。
                  * work的父标签：copyright, work。
                  * character的父标签：copyright, work。
                  */
                 val parentId: Int?,
                 /**
                  * 标签类型。
                  */
                 val type: Type,
                 /**
                  * 评分。
                  */
                 val score: Int? = null,
                 /**
                  * 喜爱标记。
                  */
                 val favorite: Boolean = false,
                 /**
                  * 相关链接。
                  */
                 val links: List<Link>? = null,
                 /**
                  * 描述。
                  */
                 val description: String = "",
                 /**
                  * [cache field]冗余的与此标签关联的image数量。
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
         * 未知。
         */
        UNKNOWN,
        /**
         * 版权方。
         */
        COPYRIGHT,
        /**
         * 作品IP。
         */
        WORK,
        /**
         * 角色。
         */
        CHARACTER
    }

    data class Link(val title: String?, val link: String)

    data class CachedAnnotation(val id: Int, val name: String)
}