package com.heerkirov.hedge.server.model

/**
 * illust和author的关联关系。
 */
data class IllustAuthorRelation(val illustId: Int, val authorId: Int, /** 由规则导出而非用户编写的标签。 */val isExported: Boolean)