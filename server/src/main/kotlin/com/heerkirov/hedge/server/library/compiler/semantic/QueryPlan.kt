package com.heerkirov.hedge.server.library.compiler.semantic

import com.heerkirov.hedge.server.library.compiler.semantic.item.DialectPlan

/**
 * 查询计划实例。
 */
class QueryPlan<D : DialectPlan>(
    /**
     * 排序计划。
     */
    val orders: OrderList,
    /**
     * 筛选过滤器。
     */
    val filters: IntersectFilter,
    /**
     * 连接过滤器。
     */
    val joins: List<*>
)

/**
 * 排序列表。其中的排序项有序排布，并指定名称和方向，因此可以翻译为排序指令。
 */
typealias OrderList = List<Order>

/**
 * 一个排序项。记录排序项的名字和它的方向。
 */
data class Order(val value: String, private val desc: Boolean) {
    fun isDescending() = desc
    fun isAscending() = !desc
}

/**
 * 筛选过滤器。查询计划的过滤器的逻辑组合一定是合取范式，因此外层是交，内层的合取项内则是并。
 */
typealias IntersectFilter = List<UnionFilter>

/**
 * 筛选过滤器的合取项。它的子项之间的关系是并。
 */
typealias UnionFilter = List<Filter>

/**
 * 筛选过滤器的一个项。
 */
interface Filter