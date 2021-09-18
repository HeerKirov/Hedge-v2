package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.MetaService
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class UtilMetaRoutes(private val metaService: MetaService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/meta") {
                post("validate/tags", ::validateTags)
            }
        }
    }

    private fun validateTags(ctx: Context) {
        val tags = try { ctx.bodyAsClass<List<Int>>() } catch (e: Exception) {
            throw ParamTypeError("tags", e.message ?: "cannot convert to List<Int>")
        }
        ctx.json(metaService.validateTags(tags))
    }
}