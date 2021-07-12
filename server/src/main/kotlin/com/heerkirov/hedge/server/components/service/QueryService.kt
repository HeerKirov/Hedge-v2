package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dto.QueryRes

class QueryService(private val queryManager: QueryManager) {
    fun querySchema(text: String, dialect: QueryManager.Dialect): QueryRes {
        val querySchema = queryManager.querySchema(text, dialect)
        return QueryRes(querySchema.visualQueryPlan, querySchema.warnings, querySchema.errors)
    }
}