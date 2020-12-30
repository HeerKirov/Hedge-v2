package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.form.AuthorCreateForm
import com.heerkirov.hedge.server.form.AuthorFilter
import com.heerkirov.hedge.server.form.AuthorUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.components.service.AuthorService
import com.heerkirov.hedge.server.form.IdRes
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class AuthorRoutes(private val authorService: AuthorService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/authors") {
                get(this::list)
                post(this::create)
                path(":id") {
                    get(this::get)
                    patch(this::update)
                    delete(this::delete)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<AuthorFilter>()
        ctx.json(authorService.list(filter))
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