package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.PartitionService
import com.heerkirov.hedge.server.components.service.QueryService
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.form.PartitionFilter
import com.heerkirov.hedge.server.form.QueryForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.utils.DateTime.parseDate
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class QueryRoutes(private val queryService: QueryService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/util/query") {
                post("schema", ::schema)
            }
        }
    }

    private fun schema(ctx: Context) {
        val body = ctx.bodyAsForm<QueryForm>()
        ctx.json(queryService.querySchema(body.text, body.dialect))
    }
}