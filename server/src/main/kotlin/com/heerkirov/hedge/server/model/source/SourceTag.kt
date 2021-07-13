package com.heerkirov.hedge.server.model.source

/**
 * 来源信息的标签。
 */
data class SourceTag(val id: Int,
                     /**
                      * 来源网站的代号。
                      */
                     val source: String,
                     /**
                      * 标签名称。
                      */
                     val name: String,
                     /**
                      * 标签的显示名称。
                      */
                     val displayName: String?,
                     /**
                      * 标签分类。
                      */
                     val type: String?)