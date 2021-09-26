package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dto.QueryRes

class QueryService(private val queryManager: QueryManager) {
    /**
     * 对HQL进行schema查询，获得schema信息和错误列表。
     * 这个API用于任务HQL查询执行之前，构建查询信息和报错。
     */
    fun querySchema(text: String, dialect: QueryManager.Dialect): QueryRes {
        val querySchema = queryManager.querySchema(text, dialect)
        return QueryRes(querySchema.visualQueryPlan, querySchema.warnings, querySchema.errors)
    }
}