package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.exceptions.BaseException
import io.javalin.Javalin
import kotlin.Exception

class ErrorHandler : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.exception(BaseException::class.java) { e, ctx ->
            ctx.status(e.status).json(ErrorResult(e.code, e.message, e.info))
        }.exception(Exception::class.java) { e, ctx ->
            ctx.status(500).json(ErrorResult("INTERNAL_ERROR", e.message, null))
        }
    }

    private data class ErrorResult(val code: String, val message: String?, val info: Any?)
}