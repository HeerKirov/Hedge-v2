package com.heerkirov.hedge.server.library.compiler.semantic.dialect

object AnnotationDialect : QueryDialect {
    override val order = orderListOf(
        orderItemOf("create-time", "create-time", "create", "ct"),
        orderItemOf("update-time", "update-time", "update", "ut")
    )

    val canBeExported = flagField("can-be-exported", "can-be-exported", "exported")
    val target = enumField("target")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
}