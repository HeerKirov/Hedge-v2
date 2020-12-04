package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.http.IdRes
import com.heerkirov.hedge.server.form.AnnotationCreateForm
import com.heerkirov.hedge.server.form.AnnotationUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.service.AnnotationService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder
import io.javalin.http.Context

class AnnotationRoutes(private val annotationService: AnnotationService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            ApiBuilder.path("api/annotations") {
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
        ctx.json(annotationService.list())
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