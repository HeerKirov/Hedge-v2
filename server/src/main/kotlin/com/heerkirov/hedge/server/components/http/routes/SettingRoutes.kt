package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.SettingImportService
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.components.service.SettingSourceService
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.form.SourceSiteForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class SettingRoutes(settingImportService: SettingImportService, settingSourceService: SettingSourceService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/setting") {
                path("import") {
                    get(import::get)
                    patch(import::update)
                }
                path("source") {
                    get("supported-sites", site::systemSiteList)
                    path("sites") {
                        get(site::get)
                        patch(site::update)
                    }
                }
            }
        }
    }

    private val import = Import(settingImportService)
    private val site = Site(settingSourceService)

    private class Import(private val service: SettingImportService) {
        fun get(ctx: Context) {
            ctx.json(service.get())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<ImportOptionUpdateForm>()
            service.update(form)
        }
    }

    private class Site(private val service: SettingSourceService) {
        fun systemSiteList(ctx: Context) {
            ctx.json(service.getSupportedSites())
        }

        fun get(ctx: Context) {
            ctx.json(service.getSites())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<List<SourceSiteForm>>()
            service.updateSites(form)
        }
    }
}