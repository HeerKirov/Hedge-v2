package com.heerkirov.hedge.server

import io.javalin.Javalin
import io.javalin.http.staticfiles.Location

fun main() {
    Javalin.create {
        it.addStaticFiles("../frontend-cli/dist", Location.EXTERNAL)
    }.start(8080)
        .get("/") { ctx ->
            ctx.html("<html><h1>Hello Javalin!</h1></html>")
        }
}