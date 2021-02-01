package com.heerkirov.hedge.server.library.compiler.semantic.plan

/**
 * 查询计划实例。
 */
class QueryPlan(
    /**
     * 排序计划。
     */
    val orders: Orders,
    /**
     * 筛选过滤器。
     */
    val filters: IntersectFilters,
    /**
     * 连接过滤器。
     */
    val joins: JoinFilters
)