package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context


class AppRoutes(private val lifetime: Lifetime, private val appdata: AppDataDriver, private val repo: DataRepository) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("app") {
                get("health", ::health)
                path("lifetime") {
                    path("permanent") {
                        get(::getPermanentList)
                        post(::updatePermanent)
                    }
                    path("signal") {
                        get(::getSignal)
                        post(::addSignal)
                        path("{id}") {
                            put(::updateSignal)
                            delete(::deleteSignal)
                        }
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

    private fun getPermanentList(ctx: Context) {
        ctx.json(this.lifetime.permanent.stats)
    }

    private fun updatePermanent(ctx: Context) {
        val form = ctx.bodyAsForm<PermanentForm>()
        this.lifetime.permanent[form.type] = form.value
        ctx.json(this.lifetime.permanent.stats)
    }

    private fun getSignal(ctx: Context) {
        val clients = this.lifetime.heartSignal.clients
        val standaloneSignal = this.lifetime.heartSignal.signal
        ctx.json(SignalResponse(clients, standaloneSignal))
    }

    private fun addSignal(ctx: Context) {
        val form = ctx.bodyAsForm<SignalForm>()
        if(form.standalone) {
            this.lifetime.heartSignal.signal(form.interval)
        }else{
            val id = this.lifetime.heartSignal.register(form.interval)
            ctx.json(AddResponse(id = id))
        }
    }

    private fun updateSignal(ctx: Context) {
        val id = ctx.pathParam("id")
        val form = ctx.bodyAsForm<SignalForm>()
        this.lifetime.heartSignal.heart(id, form.interval)
    }

    private fun deleteSignal(ctx: Context) {
        val id = ctx.pathParam("id")
        this.lifetime.heartSignal.unregister(id)
        ctx.status(204)
    }

    data class PermanentForm(val type: String, val value: Boolean)

    data class SignalForm(val interval: Long?, val standalone: Boolean = false)

    data class AddResponse(val id: String)

    data class HealthResponse(val status: LoadStatus)

    data class SignalResponse(val clients: Map<String, Long>, val standaloneSignal: Long?)
}