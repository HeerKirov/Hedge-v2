package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.IllustUtilService
import com.heerkirov.hedge.server.dto.AlbumSituationForm
import com.heerkirov.hedge.server.dto.IllustIdForm
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.library.form.bodyAsForm
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
                post("album-situation", ::getAlbumSituation)
            }
        }
    }

    private fun getCollectionSituation(ctx: Context) {
        val form = ctx.bodyAsForm<IllustIdForm>()
        ctx.json(illustUtilService.getCollectionSituation(form.illustIds))
    }

    private fun getImageSituation(ctx: Context) {
        val form = ctx.bodyAsForm<IllustIdForm>()
        ctx.json(illustUtilService.getImageSituation(form.illustIds))
    }

    private fun getAlbumSituation(ctx: Context) {
        val form = ctx.bodyAsForm<AlbumSituationForm>()
        ctx.json(illustUtilService.getAlbumSituation(form.illustIds, form.albumId, form.onlyExists))
    }
}