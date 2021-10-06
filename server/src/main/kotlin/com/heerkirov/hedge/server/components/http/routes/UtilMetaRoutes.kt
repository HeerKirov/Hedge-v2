package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.MetaUtilService
import com.heerkirov.hedge.server.dto.MetaUtilValidateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class UtilMetaRoutes(private val metaUtilService: MetaUtilService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/meta") {
                post("validate", ::validate)
            }
        }
    }

    private fun validate(ctx: Context) {
        val form = ctx.bodyAsForm<MetaUtilValidateForm>()
        ctx.json(metaUtilService.validate(form))
    }
}