package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.SourceImageService
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class SourceImageRoutes(private val sourceImageService: SourceImageService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/source-images") {
                get(::list)
                post(::create)
                post("bulk", ::createBulk)
                post("upload", ::upload)
                post("import", ::import)
                path("{source}/{source_id}") {
                    get(::get)
                    patch(::update)
                    delete(::delete)
                    get("related-images", ::getRelatedImages)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<SourceImageQueryFilter>()
        ctx.json(sourceImageService.list(filter))
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<SourceImageCreateForm>()
        sourceImageService.create(form)
        ctx.status(201)
    }

    private fun createBulk(ctx: Context) {
        val form = ctx.bodyAsForm<SourceImageBulkCreateForm>()
        sourceImageService.createBulk(form.items)
        ctx.status(201)
    }

    private fun upload(ctx: Context) {
        val form = ctx.uploadedFile("file")?.let { SourceUploadForm(it.content, it.extension.trimStart('.')) } ?: throw be(ParamRequired("file"))
        sourceImageService.upload(form)
        ctx.status(201)
    }

    private fun import(ctx: Context) {
        val form = ctx.bodyAsForm<SourceImportForm>()
        sourceImageService.import(form)
        ctx.status(201)
    }

    private fun get(ctx: Context) {
        val source = ctx.pathParamAsClass<String>("source").get()
        val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
        ctx.json(sourceImageService.get(source, sourceId))
    }

    private fun getRelatedImages(ctx: Context) {
        val source = ctx.pathParamAsClass<String>("source").get()
        val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
        ctx.json(sourceImageService.getRelatedImages(source, sourceId))
    }

    private fun update(ctx: Context) {
        val source = ctx.pathParamAsClass<String>("source").get()
        val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
        val form = ctx.bodyAsForm<SourceImageUpdateForm>()
        sourceImageService.update(source, sourceId, form)
    }

    private fun delete(ctx: Context) {
        val source = ctx.pathParamAsClass<String>("source").get()
        val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
        sourceImageService.delete(source, sourceId)
        ctx.status(204)
    }
}