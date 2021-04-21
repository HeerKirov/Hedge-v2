package com.heerkirov.hedge.server.model.illust

/**
 * 关联组。
 * 关联组能够关联图片或集合，是更加松散的关联关系。
 * 与集合相比，关联组一般更关注差分，并且更加松散。集合更加正式，会在图库列表中被分类，而关联组只有查看项目的相关内容时才会看到。
 */
data class Associate(val id: Int,
                     val cachedCount: Int)