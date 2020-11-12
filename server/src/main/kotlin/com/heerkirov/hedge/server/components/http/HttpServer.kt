package com.heerkirov.hedge.server.components.http

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.health.Health
import com.heerkirov.hedge.server.components.http.modules.Aspect
import com.heerkirov.hedge.server.components.http.modules.Authentication
import com.heerkirov.hedge.server.components.http.modules.ErrorHandler
import com.heerkirov.hedge.server.components.http.modules.WebAccessor
import com.heerkirov.hedge.server.framework.StatefulComponent
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.utils.Net
import com.heerkirov.hedge.server.utils.Token
import io.javalin.Javalin
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.net.BindException

interface HttpServer : StatefulComponent {
    /**
     * 启动HTTP server。
     */
    fun start()
}

class HttpServerOptions(
    /**
     * userData目录。
     */
    val userDataPath: String,
    /**
     * 开发模式下强制使用此路径作为获取前端资源的路径。
     */
    val frontendFromFolder: String? = null,
    /**
     * 开发模式下强制使用此端口。
     */
    val forcePort: Int? = null,
    /**
     * 当用户没有在配置中指定端口时，从此端口开始迭代。
     */
    val defaultPort: Int = 9000
)

class HttpServerImpl(private val health: Health,
                     private val appdata: AppDataDriver,
                     private val options: HttpServerOptions) : HttpServer {
    private val log: Logger = LoggerFactory.getLogger(HttpServerImpl::class.java)

    private val token: String = Token.token()
    private var port: Int? = null

    private var server: Javalin? = null

    private val web = WebAccessor(appdata, options.frontendFromFolder ?: "${Filename.FRONTEND_FOLDER}/${options.userDataPath}")

    override fun start() {
        val aspect = Aspect(appdata)
        val authentication = Authentication(token, web)
        val errorHandler = ErrorHandler()

        server = Javalin
            .create { web.configure(it) }
            .handle(aspect, authentication, web, errorHandler)
            .bind()
    }

    override val isIdle: Boolean //当web可访问且打开了web的永久访问开关时，http server标记为忙，使进程不会退出
        get() = !(web.isAccess && appdata.data.web.permanent)

    override fun close() {
        server?.stop()
    }

    /**
     * 向javalin添加新的handler。
     */
    private fun Javalin.handle(vararg endpoints: Endpoints): Javalin {
        for (endpoint in endpoints) {
            endpoint.handle(this)
        }
        return this
    }

    /**
     * 进行绑定试探。将server绑定到端口，启动http服务。
     * @throws BindException 如果所有的端口绑定都失败，那么抛出异常，告知framework发生了致命错误。
     */
    private fun Javalin.bind(): Javalin {
        val ports = options.forcePort?.let { sequenceOf(it) }
            ?: if(appdata.status == LoadStatus.LOADED) { appdata.data.service.port }else{ null }?.let { Net.analyzePort(it) }
            ?: Net.generatePort(options.defaultPort)

        for (port in ports) {
            try {
                this.start(port)
                this@HttpServerImpl.port = port
                health.save(port = port, token = token)
                return this
            }catch (e: BindException) {
                log.warn("Binding port $port failed: ${e.message}")
            }
        }
        throw BindException("Server starting failed because no port is available.")
    }
}

interface Endpoints {
    fun handle(javalin: Javalin)
}