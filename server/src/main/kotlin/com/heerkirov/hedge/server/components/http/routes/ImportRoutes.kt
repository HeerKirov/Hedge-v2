package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.components.service.ImportService
import com.heerkirov.hedge.server.exceptions.be
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class ImportRoutes(private val importService: ImportService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/imports") {
                get(::list)
                post("import", ::import)
                post("upload", ::upload)
                post("batch-update", ::batchUpdate)
                post("save", ::save)
                path("{id}") {
                    get(::get)
                    patch(::update)
                    delete(::delete)
                }
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<ImportFilter>()
        ctx.json(importService.list(filter))
    }

    private fun import(ctx: Context) {
        val form = ctx.bodyAsForm<ImportForm>()
        val (id, warnings) = importService.import(form)
        ctx.status(201).json(IdResWithWarnings(id, warnings.map { ErrorResult(it) }))
    }

    private fun upload(ctx: Context) {
        val form = ctx.uploadedFile("file")?.let { UploadForm(it.content, it.filename, it.extension.trimStart('.')) } ?: throw be(ParamRequired("file"))
        val (id, warnings) = importService.upload(form)
        ctx.status(201).json(IdResWithWarnings(id, warnings.map { ErrorResult(it) }))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParamAsClass<Int>("id").get()
        ctx.json(importService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParamAsClass<Int>("id").get()
        val form = ctx.bodyAsForm<ImportUpdateForm>()
        importService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParamAsClass<Int>("id").get()
        importService.delete(id)
        ctx.status(204)
    }

    private fun batchUpdate(ctx: Context) {
        val form = ctx.bodyAsForm<ImportBatchUpdateForm>()
        val warnings = importService.batchUpdate(form)
        ctx.status(200).json(warnings.map { (id, values) -> IdResWithWarnings(id, values.map { ErrorResult(it) }) })
    }

    private fun save(ctx: Context) {
        ctx.json(importService.save())
    }
}