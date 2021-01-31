package com.heerkirov.hedge.server.library.compiler.semantic.dialect

object IllustDialect : QueryDialect {
    override val order = orderListOf(
        orderItemOf("id", "id"),
        orderItemOf("score", "score", "s"),
        orderItemOf("ordinal", "ordinal", "ord"),
        orderItemOf("partition", "partition", "pt"),
        orderItemOf("create-time", "create-time", "create", "ct"),
        orderItemOf("update-time", "update-time", "update", "ut"),
        orderItemOf("source-id", "^id", "source-id"),
        orderItemOf("source-from", "^from", "source-from")
    )

    val favorite = flagField("favorite")
    val id = patternNumberField("id")
    val score = numberField("score")
    val partition = dateField("partition", "partition", "pt")
    val ordinal = dateField("ordinal", "ordinal", "ord")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
    val description = stringField("description", "description", "desc")
    val extension = stringField("extension", "extension", "ext")
    val filesize = sizeField("filesize", "filesize", "size")
    val sourceId = patternNumberField("source-id", "^id", "source-id")
    val sourceFrom = stringField("source-from", "^from", "source-from")
    val sourceDescription = stringField("source-description", "^description", "^desc", "source-description", "source-desc")
    val analyseStatus = enumField("analyse-status", "analyse-status", "analyse")
}