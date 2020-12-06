package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.http.IdRes
import com.heerkirov.hedge.server.form.AuthorCreateForm
import com.heerkirov.hedge.server.form.AuthorUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.service.AuthorService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder
import io.javalin.http.Context

class AuthorRoutes(private val authorService: AuthorService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            ApiBuilder.path("api/authors") {
                ApiBuilder.get(this::list)
                ApiBuilder.post(this::create)
                ApiBuilder.path(":id") {
                    ApiBuilder.get(this::get)
                    ApiBuilder.patch(this::update)
                    ApiBuilder.delete(this::delete)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        ctx.json(authorService.list())
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<AuthorCreateForm>()
        val id = authorService.create(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(authorService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<AuthorUpdateForm>()
        authorService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        authorService.delete(id)
        ctx.status(204)
    }
}