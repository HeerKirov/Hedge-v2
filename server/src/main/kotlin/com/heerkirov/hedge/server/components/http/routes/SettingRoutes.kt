package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.SettingImportService
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.components.service.SettingSourceService
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.form.SiteCreateForm
import com.heerkirov.hedge.server.form.SiteUpdateForm
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
                    path("sites") {
                        get(site::list)
                        post(site::create)
                        path(":name") {
                            get(site::get)
                            put(site::update)
                            delete(site::delete)
                        }
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
        fun list(ctx: Context) {
            ctx.json(service.list())
        }

        fun create(ctx: Context) {
            val form = ctx.bodyAsForm<SiteCreateForm>()
            service.create(form)
            ctx.status(201)
        }

        fun get(ctx: Context) {
            val name = ctx.pathParam("name")
            ctx.json(service.get(name))
        }

        fun update(ctx: Context) {
            val name = ctx.pathParam("name")
            val form = ctx.bodyAsForm<SiteUpdateForm>()
            service.update(name, form)
        }

        fun delete(ctx: Context) {
            val name = ctx.pathParam("name")
            service.delete(name)
            ctx.status(204)
        }
    }
}