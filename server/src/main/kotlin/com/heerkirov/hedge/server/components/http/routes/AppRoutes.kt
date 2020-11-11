package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.appdata.AppDataRepository
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.Reject
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context


class AppRoutes(private val lifetime: Lifetime, private val appdata: AppDataRepository) : Endpoints {
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

    private fun health(ctx: Context) {
        ctx.json(HealthResponse(status = appdata.status))
    }

    private fun init(ctx: Context) {
        if(appdata.status != LoadStatus.NOT_INIT) {
            throw Reject("Server has already been initialized.")
        }
        val form = ctx.bodyAsClass(InitForm::class.java)
        //TODO 后续还包括db的初始化
        appdata.init(form.dbPath)
    }

    private fun addLifetime(ctx: Context) {
        val form = ctx.bodyAsClass(OptionalSignalForm::class.java)
        val id = this.lifetime.register(form.interval)
        ctx.json(AddResponse(id = id))
    }

    private fun updateLifetime(ctx: Context) {
        val id = ctx.pathParam("id")
        val form = ctx.bodyAsClass(OptionalSignalForm::class.java)
        this.lifetime.heart(id, form.interval)
    }

    private fun deleteLifetime(ctx: Context) {
        val id = ctx.pathParam("id")
        this.lifetime.unregister(id)
        ctx.status(204)
    }

    private fun signal(ctx: Context) {
        val form = ctx.bodyAsClass(SignalForm::class.java)
        this.lifetime.signal(form.interval)
    }

    private data class InitForm(val dbPath: String)

    private data class SignalForm(val interval: Long)

    private data class OptionalSignalForm(val interval: Long?)

    private data class AddResponse(val id: String)

    private data class HealthResponse(val status: LoadStatus)
}