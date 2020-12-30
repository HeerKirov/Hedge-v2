package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.form.AnnotationCreateForm
import com.heerkirov.hedge.server.form.AnnotationFilter
import com.heerkirov.hedge.server.form.AnnotationUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.components.service.AnnotationService
import com.heerkirov.hedge.server.form.IdRes
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class AnnotationRoutes(private val annotationService: AnnotationService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/annotations") {
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
        val filter = ctx.queryAsFilter<AnnotationFilter>()
        ctx.json(annotationService.list(filter))
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<AnnotationCreateForm>()
        val id = annotationService.create(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(annotationService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<AnnotationUpdateForm>()
        annotationService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        annotationService.delete(id)
        ctx.status(204)
    }
}