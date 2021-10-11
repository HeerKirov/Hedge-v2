package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.framework.*

object SourceImageDialect : QueryDialect<SourceImageDialect.OrderItem> {
    override val order = orderListOf<OrderItem> {
        item(OrderItem.SOURCE, "source", "src", "s")
        item(OrderItem.SOURCE_ID, "source-id", "id")
    }
    override val elements: Array<out ElementFieldDefinition> = arrayOf(SourceTagElementField(false))

    val source = stringField("source", "src", "s")
    val sourceId = patternNumberField("source-id", "source-id", "id")
    val title = patternStringField("title", "title")
    val description = patternStringField("description", "description", "desc")

    enum class OrderItem {
        SOURCE, SOURCE_ID
    }
}