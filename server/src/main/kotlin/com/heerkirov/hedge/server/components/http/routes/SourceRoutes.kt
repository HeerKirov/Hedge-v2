package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.SourceImageService
import com.heerkirov.hedge.server.components.service.SourceMappingService
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.bodyAsListForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class SourceRoutes(private val sourceImageService: SourceImageService,
                   private val sourceMappingService: SourceMappingService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api") {
                path("source-images") {
                    get(sourceImages::list)
                    post(sourceImages::create)
                    post("bulk", sourceImages::createBulk)
                    path("{source}/{source_id}") {
                        get(sourceImages::get)
                        patch(sourceImages::update)
                        delete(sourceImages::delete)
                        get("related-images", sourceImages::getRelatedImages)
                    }
                }
                path("source-tag-mappings") {
                    post("batch-query", sourceTagMappings::batchQuery)
                    path("{source}/{source_tag_name}") {
                        get(sourceTagMappings::get)
                        put(sourceTagMappings::update)
                        delete(sourceTagMappings::delete)
                    }
                }
            }
        }
    }

    private val sourceImages = object : Any() {
        fun list(ctx: Context) {
            val filter = ctx.queryAsFilter<SourceImageQueryFilter>()
            ctx.json(sourceImageService.list(filter))
        }

        fun create(ctx: Context) {
            val form = ctx.bodyAsForm<SourceImageCreateForm>()
            sourceImageService.create(form)
            ctx.status(201)
        }

        fun createBulk(ctx: Context) {
            val form = ctx.bodyAsForm<SourceImageBulkCreateForm>()
            sourceImageService.createBulk(form.items)
            ctx.status(201)
        }

        fun get(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
            ctx.json(sourceImageService.get(source, sourceId))
        }

        fun getRelatedImages(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
            ctx.json(sourceImageService.getRelatedImages(source, sourceId))
        }

        fun update(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
            val form = ctx.bodyAsForm<SourceImageUpdateForm>()
            sourceImageService.update(source, sourceId, form)
        }

        fun delete(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceId = ctx.pathParamAsClass<Long>("source_id").get()
            sourceImageService.delete(source, sourceId)
            ctx.status(204)
        }
    }

    private val sourceTagMappings = object : Any() {
        fun batchQuery(ctx: Context) {
            val form = ctx.bodyAsForm<SourceMappingBatchQueryForm>()
            ctx.json(sourceMappingService.batchQuery(form))
        }

        fun get(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceTagName = ctx.pathParamAsClass<String>("source_tag_name").get()
            ctx.json(sourceMappingService.query(source, sourceTagName))
        }

        fun update(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceTagName = ctx.pathParamAsClass<String>("source_tag_name").get()
            val form = ctx.bodyAsListForm<SourceMappingTargetItem>()
            sourceMappingService.update(source, sourceTagName, form)
        }

        fun delete(ctx: Context) {
            val source = ctx.pathParamAsClass<String>("source").get()
            val sourceTagName = ctx.pathParamAsClass<String>("source_tag_name").get()
            sourceMappingService.delete(source, sourceTagName)
            ctx.status(204)
        }
    }
}