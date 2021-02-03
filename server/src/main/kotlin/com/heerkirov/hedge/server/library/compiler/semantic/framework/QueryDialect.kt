package com.heerkirov.hedge.server.library.compiler.semantic.framework


/**
 * 查询方言的定义框架。
 */
interface QueryDialect<ORDER : Enum<ORDER>> {
    val order: OrderFieldDefinition<ORDER>
    val elements: Array<out ElementFieldDefinition>
}
