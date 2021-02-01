package com.heerkirov.hedge.server.library.compiler.semantic.framework

import kotlin.reflect.KClass


/**
 * 排序列表定义。
 */
class OrderDefinition<T : Enum<T>>(private val clazz: KClass<T>, private val items: List<OrderItemDefinition<T>>) {
    /**
     * 从[^]name映射到对应的项。
     */
    private val aliasMap: Map<String, OrderItemDefinition<T>> = mutableMapOf<String, OrderItemDefinition<T>>().also { aliasMap ->
        for (item in items) {
            for (alias in item.alias) {
                val aliasName = alias.toString()
                if(aliasName in aliasMap) throw RuntimeException("Order item alias $aliasName is duplicated.")
                aliasMap[aliasName] = item
            }
        }
    }
}

/**
 * 一个排序列表的定义项。
 * @param key 输出的查询计划中的定义名称。
 * @param alias 从语义树获取的名称。需要注意key不在获取名称中。
 */
class OrderItemDefinition<T : Enum<T>>(val key: T, val alias: List<Alias>) {
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

class OrderListBuilder<T : Enum<T>>(private val list: MutableList<OrderItemDefinition<T>>) {
    fun item(key: T, vararg alias: String) {
        list.add(OrderItemDefinition(key, alias.map { if(it.startsWith("^")) OrderItemDefinition.Alias(it.substring(1), true) else OrderItemDefinition.Alias(it, false) }))
    }
}

/**
 * 定义一个排序列表。
 */
inline fun <reified T : Enum<T>> orderListOf(block: OrderListBuilder<T>.() -> Unit): OrderDefinition<T> {
    val list = ArrayList<OrderItemDefinition<T>>()
    val builder = OrderListBuilder(list)
    builder.block()
    return OrderDefinition(T::class, list)
}
