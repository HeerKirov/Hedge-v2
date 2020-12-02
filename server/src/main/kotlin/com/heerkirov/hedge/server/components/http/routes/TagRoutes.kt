package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.http.IdRes
import com.heerkirov.hedge.server.form.TagCreateForm
import com.heerkirov.hedge.server.form.TagUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.service.TagService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class TagRoutes(private val tagService: TagService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/tags") {
                get(this::list)
                post(this::create)
                get("tree", this::tree)
                path(":id") {
                    get(this::get)
                    patch(this::update)
                    delete(this::delete)
                    post("duplicate", this::duplicate)
                    post("merge", this::merge)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        ctx.json(tagService.list())
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<TagCreateForm>()
        val id = tagService.create(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun tree(ctx: Context) {
        ctx.json(tagService.tree())
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(tagService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<TagUpdateForm>()
        tagService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        tagService.delete(id)
        ctx.status(204)
    }

    private fun duplicate(ctx: Context) {

    }

    private fun merge(ctx: Context) {

    }
}