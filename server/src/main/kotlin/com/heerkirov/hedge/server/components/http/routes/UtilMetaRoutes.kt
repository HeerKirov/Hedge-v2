package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.MetaUtilService
import com.heerkirov.hedge.server.dto.MetaUtilIdentityForm
import com.heerkirov.hedge.server.dto.MetaUtilMetaForm
import com.heerkirov.hedge.server.dto.MetaUtilValidateForm
import com.heerkirov.hedge.server.enums.IdentityType
import com.heerkirov.hedge.server.library.form.bodyAsForm
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.http.Context

class UtilMetaRoutes(private val metaUtilService: MetaUtilService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/utils/meta-editor") {
                post("validate", ::validate)
                post("suggest", ::suggest)
                path("history") {
                    path("identities") {
                        get(::getHistoryIdentityList)
                        get("{type}/{id}", ::getHistoryIdentityDetail)
                        post(::pushHistoryIdentity)
                    }
                    path("meta-tags") {
                        get("recent", ::getHistoryMetaRecent)
                        get("frequent", ::getHistoryMetaFrequent)
                        post(::pushHistoryMeta)
                        delete(::deleteAllHistoryMeta)
                    }
                }
            }
        }
    }

    private fun validate(ctx: Context) {
        val form = ctx.bodyAsForm<MetaUtilValidateForm>()
        ctx.json(metaUtilService.validate(form))
    }

    private fun suggest(ctx: Context) {
        val form = ctx.bodyAsForm<MetaUtilIdentityForm>()
        ctx.json(metaUtilService.suggest(form))
    }

    private fun getHistoryIdentityList(ctx: Context) {
        ctx.json(metaUtilService.getHistoryIdentityList())
    }

    private fun getHistoryIdentityDetail(ctx: Context) {
        val type = IdentityType.valueOf(ctx.pathParam("type").uppercase())
        val id = ctx.pathParamAsClass<Int>("id").get()
        ctx.json(metaUtilService.getHistoryIdentityDetail(type, id))
    }

    private fun pushHistoryIdentity(ctx: Context) {
        val form = ctx.bodyAsForm<MetaUtilIdentityForm>()
        metaUtilService.pushHistoryIdentity(form)
    }

    private fun getHistoryMetaRecent(ctx: Context) {
        ctx.json(metaUtilService.getHistoryMetaRecent())
    }

    private fun getHistoryMetaFrequent(ctx: Context) {
        ctx.json(metaUtilService.getHistoryMetaFrequent())
    }

    private fun pushHistoryMeta(ctx: Context) {
        val form = ctx.bodyAsForm<MetaUtilMetaForm>()
        metaUtilService.pushHistoryMeta(form)
    }

    private fun deleteAllHistoryMeta(ctx: Context) {
        metaUtilService.deleteAllHistoryMeta()
        ctx.status(204)
    }
}