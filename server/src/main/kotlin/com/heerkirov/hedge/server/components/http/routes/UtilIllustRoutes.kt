package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.IllustUtilService
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.exceptions.be
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.http.Context

class UtilIllustRoutes(private val illustUtilService: IllustUtilService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/illust") {
                post("collection-situation", ::getCollectionSituation)
                post("image-situation", ::getImageSituation)
            }
        }
    }

    private fun getCollectionSituation(ctx: Context) {
        val illusts = try { ctx.bodyAsClass<List<Int>>() } catch (e: Exception) {
            throw be(ParamTypeError("illusts", e.message ?: "cannot convert to List<Int>"))
        }
        ctx.json(illustUtilService.getCollectionSituation(illusts))
    }

    private fun getImageSituation(ctx: Context) {
        val illusts = try { ctx.bodyAsClass<List<Int>>() } catch (e: Exception) {
            throw be(ParamTypeError("illusts", e.message ?: "cannot convert to List<Int>"))
        }
        ctx.json(illustUtilService.getImageSituation(illusts))
    }
}