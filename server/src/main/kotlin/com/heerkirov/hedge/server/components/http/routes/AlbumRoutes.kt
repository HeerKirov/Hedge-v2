package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.AlbumService
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.library.form.bodyAsForm
import com.heerkirov.hedge.server.library.form.queryAsFilter
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class AlbumRoutes(private val albumService: AlbumService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/albums") {
                get(::list)
                post(::create)
                path(":id") {
                    get(::get)
                    patch(::update)
                    delete(::delete)
                    path("images") {
                        get(::listImages)
                        put(::updateImages)
                        patch(::partialUpdateImages)
                    }
                }
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<AlbumQueryFilter>()
        ctx.json(albumService.list(filter))
    }

    private fun create(ctx: Context) {
        val form = ctx.bodyAsForm<AlbumCreateForm>()
        val id = albumService.create(form)
        ctx.status(201).json(IdRes(id))
    }

    private fun get(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        ctx.json(albumService.get(id))
    }

    private fun update(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<AlbumUpdateForm>()
        albumService.update(id, form)
    }

    private fun delete(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        albumService.delete(id)
        ctx.status(204)
    }

    private fun listImages(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val filter = ctx.queryAsFilter<LimitAndOffsetFilter>()
        ctx.json(albumService.getImages(id, filter))
    }

    private fun updateImages(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val images = try { ctx.body<List<Int>>() }catch (e: Exception) {
            throw ParamTypeError("images", e.message ?: "cannot convert to List<Int>")
        }
        albumService.updateImages(id, images)
    }

    private fun partialUpdateImages(ctx: Context) {
        val id = ctx.pathParam<Int>("id").get()
        val form = ctx.bodyAsForm<AlbumImagesPartialUpdateForm>()
        albumService.partialUpdateImages(id, form)
    }
}