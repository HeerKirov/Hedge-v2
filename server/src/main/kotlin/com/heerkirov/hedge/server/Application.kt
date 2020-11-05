package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.utils.Parameters
import com.heerkirov.hedge.server.utils.Resources
import io.javalin.Javalin
import io.javalin.http.staticfiles.Location
import java.io.FileReader

fun main(args: Array<String>) {
    val parameters = Parameters(args)
    val resources = Resources()

    Javalin.create {
        it.addStaticFiles("/static", "../frontend/dist/static", Location.EXTERNAL)
        it.addStaticFiles("/favicon.ico", "../frontend/dist/favicon.ico", Location.EXTERNAL)
    }.start(9000)
        .get("/") { ctx ->
//            FileReader("../frontend/dist/index.html").use {  fr ->
//                ctx.html(fr.readText())
//            }
            ctx.html(resources.getResource("/forbidden.html"))
        }
}