package com.heerkirov.hedge.server.library.compiler.semantic.dialect

object AuthorDialect : QueryDialect {
    override val order = orderListOf(
        orderItemOf("score", "score", "s"),
        orderItemOf("image-count", "image-count", "count"),
        orderItemOf("create-time", "create-time", "create", "ct"),
        orderItemOf("update-time", "update-time", "update", "ut")
    )

    val favorite = flagField("favorite")
    val type = enumField("type")
    val score = numberField("score")
    val imageCount = numberField("image-count")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
    val description = stringField("description", "description", "desc")
    val title = stringField("title")
}