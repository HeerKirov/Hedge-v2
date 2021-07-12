package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.exceptions.BaseException
import com.heerkirov.hedge.server.dto.ErrorResult
import io.javalin.Javalin
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.Exception

class ErrorHandler : Endpoints {
    private val log: Logger = LoggerFactory.getLogger(ErrorHandler::class.java)

    override fun handle(javalin: Javalin) {
        javalin.exception(BaseException::class.java) { e, ctx ->
            ctx.status(e.status).json(ErrorResult(e))
        }.exception(Exception::class.java) { e, ctx ->
            ctx.status(500).json(ErrorResult("INTERNAL_ERROR", e.message, null))
            log.error("Unexpected exception thrown.", e)
        }
    }
}