package com.heerkirov.hedge.server.components.http

import com.heerkirov.hedge.server.framework.StatefulComponent
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.utils.Resources
import io.javalin.Javalin
import io.javalin.http.staticfiles.Location

interface HttpServer : StatefulComponent {
    /**
     * 启动HTTP server。
     */
    fun start()
}

class HttpServerOptions(
    val userDataPath: String,
    val frontendFromFolder: String? = null
)

class HttpServerImpl(options: HttpServerOptions) : HttpServer {
    private val frontendPath = options.frontendFromFolder ?: "${Filename.FRONTEND_FOLDER}/${options.userDataPath}"

    private lateinit var server: Javalin

    override fun start() {
        server = Javalin.create {
            it.addStaticFiles("/static", "${frontendPath}/static", Location.EXTERNAL)
            it.addStaticFiles("/favicon.ico", "${frontendPath}/favicon.ico", Location.EXTERNAL)
        }
            .get("/") { ctx ->
                ctx.html(Resources.getResourceAsText("/forbidden.html"))
            }

        //TODO 绑定试探
        server.start(9000)
    }

    override val isIdle: Boolean
        get() = true

    override fun close() {
        server.stop()
    }
}