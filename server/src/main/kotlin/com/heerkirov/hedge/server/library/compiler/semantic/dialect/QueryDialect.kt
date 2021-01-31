package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.*

/**
 * 查询方言的定义框架。
 */
interface QueryDialect {
    val order: OrderDefinition
}


/**
 * 排序列表定义。
 */
class OrderDefinition internal constructor(private val items: List<OrderItemDefinition>) {
    /**
     * 从[^]name映射到对应的项。
     */
    private val aliasMap: Map<String, OrderItemDefinition>

    init {
        this.aliasMap = mutableMapOf<String, OrderItemDefinition>().also { aliasMap ->
            for (item in items) {
                for (alias in item.alias) {
                    val aliasName = alias.toString()
                    if(aliasName in aliasMap) throw RuntimeException("Order item alias $aliasName is duplicated.")
                    aliasMap[aliasName] = item
                }
            }
        }
    }
}

/**
 * 一个排序列表的定义项。
 * @param key 输出的查询计划中的定义名称。
 * @param alias 从语义树获取的名称。需要注意key不在获取名称中。
 */
class OrderItemDefinition internal constructor(val key: String, val alias: List<Alias>) {
    /**
     * 一个语义树中的名称定义。
     * @param name 名称
     * @param sourceFlag 需要^符号定义
     */
    data class Alias(val name: String, val sourceFlag: Boolean = false) {
        override fun toString(): String {
            return (if(sourceFlag) "^" else "") + name
        }
    }
}

/**
 * 定义一个排序列表。
 */
fun QueryDialect.orderListOf(vararg items: OrderItemDefinition): OrderDefinition {
    return OrderDefinition(items.toList())
}

/**
 * 定义一个排序列表项。
 * @param alias 编写可选择项的名称。名称前加^会被解析为sourceFlag = true
 */
fun QueryDialect.orderItemOf(key: String, vararg alias: String): OrderItemDefinition {
    return OrderItemDefinition(key, alias.map { if(it.startsWith("^")) OrderItemDefinition.Alias(it.substring(1), true) else OrderItemDefinition.Alias(it, false) })
}

/*
 * TODO field的定义需要更高层次的抽象，以解决以下问题：
 *  1. 有些field是通过meta tag生成的，比如author/topic的title。
 *  2. 尽管类型确定，但从语义树翻译的规则不一样。比如illust.extension会将string全翻译成equal，illust.description则会根据精确性翻译成equal或match。
 *  3. 为枚举类型注入枚举。
 * TODO 有关join类型的定义，和order类似，也定义生成器。生成器有3种，分别是meta tag的生成器、annotation的生成器、从filter派生的生成器(如topic.parent)。
 * TODO order的类型定义，改为枚举实现，以提供更好的类型限制。
 */

/**
 * filter的目标属性定义。
 */
class FilterFieldDefinition<V : FilterValue>(val key: String, vararg val alias: String)

fun QueryDialect.numberField(key: String, vararg alias: String): FilterFieldDefinition<FilterNumberValue> {
    TODO()
}

fun QueryDialect.patternNumberField(key: String, vararg alias: String): FilterFieldDefinition<FilterPatternNumberValue> {
    TODO()
}

fun QueryDialect.dateField(key: String, vararg alias: String): FilterFieldDefinition<FilterDateValue> {
    TODO()
}

fun QueryDialect.sizeField(key: String, vararg alias: String): FilterFieldDefinition<FilterSizeValue> {
    TODO()
}

fun QueryDialect.stringField(key: String, vararg alias: String): FilterFieldDefinition<FilterNumberValue> {
    TODO()
}

fun QueryDialect.enumField(key: String, vararg alias: String): FilterFieldDefinition<FilterNumberValue> {
    TODO()
}

fun QueryDialect.flagField(key: String, vararg alias: String): FilterFieldDefinition<FilterNothingValue> {
    TODO()
}
