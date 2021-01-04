package com.heerkirov.hedge.server.model.illust

/**
 * illust和tag的关联关系。
 */
data class IllustTagRelation(val illustId: Int, val tagId: Int, /** 由规则导出而非用户编写的标签。 */val isExported: Boolean)