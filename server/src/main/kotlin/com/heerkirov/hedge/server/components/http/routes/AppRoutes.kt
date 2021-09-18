package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.Reject
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context


class AppRoutes(private val lifetime: Lifetime, private val appdata: AppDataDriver, private val repo: DataRepository) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("app") {
                get("health", ::health)
                post("signal", ::signal)
                path("lifetime") {
                    post(::addLifetime)
                    path("{id}") {
                        put(::updateLifetime)
                        delete(::deleteLifetime)
                    }
                }
            }
        }
    }

    /**
     * 一般用来健康检查的api。此外，提供对appdata加载状态的检查。
     */
    private fun health(ctx: Context) {
        val status = if(appdata.status == LoadStatus.LOADED && repo.status === LoadStatus.LOADED) {
            LoadStatus.LOADED
        }else{
            LoadStatus.LOADING
        }
        ctx.json(HealthResponse(status = status))
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

    data class SignalForm(val interval: Long)

    data class OptionalSignalForm(val interval: Long?)

    data class AddResponse(val id: String)

    data class HealthResponse(val status: LoadStatus)
}