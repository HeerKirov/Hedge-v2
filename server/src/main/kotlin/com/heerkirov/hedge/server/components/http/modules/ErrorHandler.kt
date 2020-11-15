package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.exceptions.BaseException
import io.javalin.Javalin
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.Exception

class ErrorHandler : Endpoints {
    private val log: Logger = LoggerFactory.getLogger(ErrorHandler::class.java)

    override fun handle(javalin: Javalin) {
        javalin.exception(BaseException::class.java) { e, ctx ->
            ctx.status(e.status).json(ErrorResult(e.code, e.message, e.info))
        }.exception(Exception::class.java) { e, ctx ->
            ctx.status(500).json(ErrorResult("INTERNAL_ERROR", e.message, null))
            log.error("Expected exception thrown.", e)
        }
    }

    private data class ErrorResult(val code: String, val message: String?, val info: Any?)
}