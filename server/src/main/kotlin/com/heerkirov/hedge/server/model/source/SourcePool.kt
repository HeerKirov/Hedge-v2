package com.heerkirov.hedge.server.model.source

/**
 * 来源信息的pool。
 */
data class SourcePool(val id: Int,
                      /**
                      * 来源网站的代号。
                      */
                     val source: String,
                      /**
                      * pool key。
                      */
                     val key: String,
                      /**
                      * pool标题。
                      */
                     val title: String)