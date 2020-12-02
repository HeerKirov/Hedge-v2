package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.Reject
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context


class AppRoutes(private val lifetime: Lifetime, private val appdata: AppDataDriver) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("app") {
                get("health", this::health)
                post("init", this::init)
                post("signal", this::signal)
                path("lifetime") {
                    post(this::addLifetime)
                    path(":id") {
                        put(this::updateLifetime)
                        delete(this::deleteLifetime)
                    }
                }
            }
        }
    }

    /**
     * 一般用来健康检查的api。此外，提供对appdata加载状态的检查。
     */
    private fun health(ctx: Context) {
        ctx.json(HealthResponse(status = appdata.status))
    }

    /**
     * 对server进行初始化。
     * @throws Reject server已经初始化过了。
     */
    private fun init(ctx: Context) {
        if(appdata.status != LoadStatus.NOT_INIT) {
            throw Reject("Server has already been initialized.")
        }
        val form = ctx.bodyAsForm<InitForm>()
        appdata.init(form.dbPath)
    }

    private fun addLifetime(ctx: Context) {
        val form = ctx.bodyAsForm<OptionalSignalForm>()
        val id = this.lifetime.register(form.interval)
        ctx.json(AddResponse(id = id))
    }

    private fun updateLifetime(ctx: Context) {
        val id = ctx.pathParam("id")
        val form = ctx.bodyAsForm<OptionalSignalForm>()
        this.lifetime.heart(id, form.interval)
    }

    private fun deleteLifetime(ctx: Context) {
        val id = ctx.pathParam("id")
        this.lifetime.unregister(id)
        ctx.status(204)
    }

    private fun signal(ctx: Context) {
        val form = ctx.bodyAsForm<SignalForm>()
        this.lifetime.signal(form.interval)
    }

    private data class InitForm(val dbPath: String)

    private data class SignalForm(val interval: Long)

    private data class OptionalSignalForm(val interval: Long?)

    private data class AddResponse(val id: String)

    private data class HealthResponse(val status: LoadStatus)
}