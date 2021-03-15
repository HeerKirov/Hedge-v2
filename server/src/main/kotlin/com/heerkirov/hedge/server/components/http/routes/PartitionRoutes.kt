package com.heerkirov.hedge.server.components.http.routes

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.service.PartitionService
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.form.PartitionFilter
import com.heerkirov.hedge.server.library.form.queryAsFilter
import com.heerkirov.hedge.server.utils.DateTime.parseDate
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.http.Context

class PartitionRoutes(private val partitionService: PartitionService) : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.routes {
            path("api/partitions") {
                get(::list)
                get("months", ::listMonths)
                get(":date", ::get)
            }
        }
    }

    private fun list(ctx: Context) {
        val filter = ctx.queryAsFilter<PartitionFilter>()
        ctx.json(partitionService.list(filter))
    }

    private fun get(ctx: Context) {
        val dateStr = ctx.pathParam("date")
        val date = try { dateStr.parseDate() }catch (e: Exception) {
            throw ParamError("date")
        }
        ctx.json(partitionService.get(date))
    }

    private fun listMonths(ctx: Context) {
        ctx.json(partitionService.listMonths())
    }
}