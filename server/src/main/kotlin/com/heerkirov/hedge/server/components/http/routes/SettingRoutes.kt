package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.appdata.ServiceOption
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.form.*
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class SettingRoutes(settingMetaService: SettingMetaService,
                    settingQueryService: SettingQueryService,
                    settingImportService: SettingImportService,
                    settingSourceService: SettingSourceService,
                    settingSpiderService: SettingSpiderService,
                    settingAppdataService: SettingAppdataService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/setting") {
                path("web") {
                    get(web::get)
                    patch(web::update)
                }
                path("service") {
                    get(service::get)
                    patch(service::update)
                }
                path("backup") {
                    get(backup::get)
                    patch(backup::update)
                    post("sync", ::notImplemented)
                }
                path("proxy") {
                    get(proxy::get)
                    patch(proxy::update)
                }
                path("meta") {
                    get(meta::get)
                    patch(meta::update)
                }
                path("query") {
                    get(query::get)
                    patch(query::update)
                }
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
                    path("spider") {
                        get("usable-rules", spider::getRuleList)
                        get(spider::get)
                        patch(spider::update)
                    }
                }
                path("file") {
                    get(::notImplemented)
                    patch(::notImplemented)
                }
            }
        }
    }

    private val meta = Meta(settingMetaService)
    private val query = Query(settingQueryService)
    private val import = Import(settingImportService)
    private val site = Site(settingSourceService)
    private val spider = Spider(settingSpiderService)
    private val web = Web(settingAppdataService)
    private val service = Service(settingAppdataService)
    private val backup = Backup(settingAppdataService)
    private val proxy = Proxy(settingAppdataService)

    private fun notImplemented(ctx: Context) {
        throw NotImplementedError()
    }

    private class Web(private val service: SettingAppdataService) {
        fun get(ctx: Context) {
            ctx.json(service.getWeb())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<WebOptionUpdateForm>()
            service.updateWeb(form)
        }
    }

    private class Service(private val service: SettingAppdataService) {
        fun get(ctx: Context) {
            ctx.json(service.getService())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<ServiceOption>()
            service.updateService(form)
        }
    }

    private class Backup(private val service: SettingAppdataService) {
        fun get(ctx: Context) {
            ctx.json(service.getBackup())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<BackupOptionUpdateForm>()
            service.updateBackup(form)
        }
    }

    private class Proxy(private val service: SettingAppdataService) {
        fun get(ctx: Context) {
            ctx.json(service.getProxy())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<ProxyOptionUpdateForm>()
            service.updateProxy(form)
        }
    }

    private class Meta(private val service: SettingMetaService) {
        fun get(ctx: Context) {
            ctx.json(service.get())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<MetaOptionUpdateForm>()
            service.update(form)
        }
    }

    private class Query(private val service: SettingQueryService) {
        fun get(ctx: Context) {
            ctx.json(service.get())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<QueryOptionUpdateForm>()
            service.update(form)
        }
    }

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

    private class Spider(private val service: SettingSpiderService) {
        fun getRuleList(ctx: Context) {
            ctx.json(service.getSpiderRuleList())
        }

        fun get(ctx: Context) {
            ctx.json(service.get())
        }

        fun update(ctx: Context) {
            val form = ctx.bodyAsForm<SpiderOptionUpdateForm>()
            service.update(form)
        }
    }
}