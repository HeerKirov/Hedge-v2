package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.IllustUtilService
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.http.Context

class UtilIllustRoutes(private val illustUtilService: IllustUtilService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/illust") {
                post("collection-situation", ::getCollectionSituation)
            }
        }
    }

    private fun getCollectionSituation(ctx: Context) {
        val illusts = try { ctx.bodyAsClass<List<Int>>() } catch (e: Exception) {
            throw ParamTypeError("illusts", e.message ?: "cannot convert to List<Int>")
        }
        ctx.json(illustUtilService.getCollectionSituation(illusts))
    }
}