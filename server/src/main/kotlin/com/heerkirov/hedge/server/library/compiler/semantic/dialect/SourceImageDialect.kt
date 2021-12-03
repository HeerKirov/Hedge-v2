package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.framework.*

object SourceImageDialect : QueryDialect<SourceImageDialect.OrderItem> {
    override val order = orderListOf<OrderItem> {
        item(OrderItem.SOURCE, "source", "src", "s")
        item(OrderItem.SOURCE_ID, "source-id", "id")
    }
    override val elements: Array<out ElementFieldDefinition> = arrayOf(SourceTagElementField(false))

    val source = stringField("SOURCE", "source", "src", "s")
    val sourceId = patternNumberField("SOURCE_ID", "source-id", "id")
    val title = patternStringField("TITLE", "title")
    val description = patternStringField("DESCRIPTION", "description", "desc")

    enum class OrderItem {
        SOURCE, SOURCE_ID
    }
}