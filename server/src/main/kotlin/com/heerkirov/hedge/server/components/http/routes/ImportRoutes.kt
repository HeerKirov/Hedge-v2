package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.http.IdRes
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.service.ImportService
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class ImportRoutes(private val importService: ImportService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/imports") {
                get(this::list)
                post("import", this::import)
                post("upload", this::upload)
                post("find-duplicate", this::findDuplicate)
                post("analyse-source", this::analyseSource)
                post("generate-time", this::generateTime)
                post("generate-action", this::generateAction)
                post("save", this::save)
                path(":id") {
                    get(this::get)
                    patch(this::update)
                    delete(this::delete)
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
        val id = importService.import(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun upload(ctx: Context) {
        val form = ctx.uploadedFile("file")?.let { UploadForm(it.content, it.filename, it.extension) } ?: throw ParamRequired("file")
        val id = importService.upload(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(importService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<ImportUpdateForm>()
        importService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        importService.delete(id)
        ctx.status(204)
    }

    private fun findDuplicate(ctx: Context) {
        val form = ctx.bodyAsForm<FindDuplicateForm>()
        ctx.json(importService.findDuplicate(form))
    }

    private fun analyseSource(ctx: Context) {
        val form = ctx.bodyAsForm<AnalyseSourceForm>()
        ctx.json(importService.analyseSource(form))
    }

    private fun generateTime(ctx: Context) {
        val form = ctx.bodyAsForm<GenerateTimeForm>()
        ctx.json(importService.generateTime(form))
    }

    private fun generateAction(ctx: Context) {
        val form = ctx.bodyAsForm<GenerateActionForm>()
        ctx.json(importService.generateAction(form))
    }

    private fun save(ctx: Context) {
        importService.save()
    }
}