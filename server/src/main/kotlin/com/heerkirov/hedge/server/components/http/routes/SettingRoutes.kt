package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.form.SiteCreateForm
import com.heerkirov.hedge.server.form.SiteUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.components.service.SettingSourceSiteService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class SettingRoutes(settingSourceSiteService: SettingSourceSiteService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/setting") {
                path("source") {
                    get("system-sites", site::systemSiteList)
                    path("sites") {
                        get(site::list)
                        post(site::create)
                        path(":name") {
                            get(site::get)
                            patch(site::update)
                            delete(site::delete)
                        }
                    }
                }
            }
        }
    }

    private val site = Site(settingSourceSiteService)

    private class Site(private val siteService: SettingSourceSiteService) {
        fun systemSiteList(ctx: Context) {
            ctx.json(siteService.supportedSiteList())
        }

        fun list(ctx: Context) {
            ctx.json(siteService.list())
        }

        fun create(ctx: Context) {
            val form = ctx.bodyAsForm<SiteCreateForm>()
            siteService.create(form)
            ctx.status(201)
        }

        fun get(ctx: Context) {
            val name = ctx.pathParam("name")
            ctx.json(siteService.get(name))
        }

        fun update(ctx: Context) {
            val name = ctx.pathParam("name")
            val form = ctx.bodyAsForm<SiteUpdateForm>()
            siteService.update(name, form)
        }

        fun delete(ctx: Context) {
            val name = ctx.pathParam("name")
            siteService.delete(name)
            ctx.status(204)
        }
    }
}