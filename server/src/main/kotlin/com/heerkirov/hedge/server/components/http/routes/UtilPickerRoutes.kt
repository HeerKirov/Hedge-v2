package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.PickerUtilService
import com.heerkirov.hedge.server.dto.HistoryPushForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class UtilPickerRoutes(private val pickerUtilService: PickerUtilService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/picker/history") {
                get("folders", ::getRecentFolders)
                get("topics", ::getRecentTopics)
                get("annotations", ::getRecentAnnotations)
                post(::push)
            }
        }
    }

    private fun getRecentFolders(ctx: Context) {
        ctx.json(pickerUtilService.getRecentFolders())
    }

    private fun getRecentTopics(ctx: Context) {
        ctx.json(pickerUtilService.getRecentTopics())
    }

    private fun getRecentAnnotations(ctx: Context) {
        ctx.json(pickerUtilService.getRecentAnnotations())
    }

    private fun push(ctx: Context) {
        val form = ctx.bodyAsForm<HistoryPushForm>()
        pickerUtilService.pushUsedHistory(form)
    }
}