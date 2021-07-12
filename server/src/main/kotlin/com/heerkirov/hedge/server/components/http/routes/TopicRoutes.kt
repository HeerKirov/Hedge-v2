package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.components.service.TopicService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class TopicRoutes(private val topicService: TopicService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/topics") {
                get(::list)
                post(::create)
                path(":id") {
                    get(::get)
                    patch(::update)
                    delete(::delete)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<TopicFilter>()
        ctx.json(topicService.list(filter))
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<TopicCreateForm>()
        val id = topicService.create(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(topicService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<TopicUpdateForm>()
        topicService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        topicService.delete(id)
        ctx.status(204)
    }
}