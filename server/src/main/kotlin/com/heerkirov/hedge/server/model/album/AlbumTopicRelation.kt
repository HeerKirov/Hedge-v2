package com.heerkirov.hedge.server.model.album

/**
 * album和topic的关联关系。
 */
data class AlbumTopicRelation(val albumId: Int, val topicId: Int, /** 由规则导出而非用户编写的标签。 */val isExported: Boolean)