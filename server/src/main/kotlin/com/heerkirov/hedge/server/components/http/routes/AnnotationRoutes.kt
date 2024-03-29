package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.dto.AnnotationCreateForm
import com.heerkirov.hedge.server.dto.AnnotationFilter
import com.heerkirov.hedge.server.dto.AnnotationUpdateForm
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.components.service.AnnotationService
import com.heerkirov.hedge.server.dto.IdRes
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class AnnotationRoutes(private val annotationService: AnnotationService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/annotations") {
                get(::list)
                post(::create)
                path("{id}") {
                    get(::get)
                    patch(::update)
                    delete(::delete)
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
        val id = ctx.pathParamAsClass<Int>("id").get()
        ctx.json(annotationService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParamAsClass<Int>("id").get()
        val form = ctx.bodyAsForm<AnnotationUpdateForm>()
        annotationService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParamAsClass<Int>("id").get()
        annotationService.delete(id)
        ctx.status(204)
    }
}