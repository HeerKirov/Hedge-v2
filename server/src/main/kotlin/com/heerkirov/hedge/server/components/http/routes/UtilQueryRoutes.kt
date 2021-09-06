package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.QueryService
import com.heerkirov.hedge.server.dto.QueryForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class UtilQueryRoutes(private val queryService: QueryService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/query") {
                post("schema", ::schema)
            }
        }
    }

    private fun schema(ctx: Context) {
        val body = ctx.bodyAsForm<QueryForm>()
        ctx.json(queryService.querySchema(body.text, body.dialect))
    }
}