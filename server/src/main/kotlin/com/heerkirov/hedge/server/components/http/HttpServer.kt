package com.heerkirov.hedge.server.components.http

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.health.Health
import com.heerkirov.hedge.server.components.http.modules.Aspect
import com.heerkirov.hedge.server.components.http.modules.Authentication
import com.heerkirov.hedge.server.components.http.modules.ErrorHandler
import com.heerkirov.hedge.server.components.http.modules.WebAccessor
import com.heerkirov.hedge.server.components.http.routes.*
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.components.service.AllServices
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.utils.Net
import com.heerkirov.hedge.server.utils.Token
import com.heerkirov.hedge.server.utils.objectMapper
import io.javalin.Javalin
import io.javalin.plugin.json.JavalinJackson
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.net.BindException

interface HttpServer : StatefulComponent {
    /**
     * 启动HTTP server。
     */
    override fun load()
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
     * 开发模式下强制使用此token。
     */
    val forceToken: String? = null,
    /**
     * 开发模式下强制使用此端口。
     */
    val forcePort: Int? = null,
    /**
     * 当用户没有在配置中指定端口时，从此端口开始迭代。
     */
    val defaultPort: Int = 9000
)

class HttpServerImpl(private val allServices: AllServices,
                     private val health: Health,
                     private val lifetime: Lifetime,
                     private val appdata: AppDataDriver,
                     private val webController: WebController,
                     private val options: HttpServerOptions) : HttpServer {
    private val token: String = options.forceToken ?: Token.token()
    private var port: Int? = null

    private var server: Javalin? = null

    private val web = WebAccessor(appdata, webController, options.frontendFromFolder ?: "${options.userDataPath}/${Filename.FRONTEND_FOLDER}")

    override fun load() {
        JavalinJackson.configure(objectMapper())

        val aspect = Aspect(appdata)
        val authentication = Authentication(token, web, webController)
        val errorHandler = ErrorHandler()

        server = Javalin
            .create {
                it.enableCorsForAllOrigins()
                web.configure(it)
            }
            .handle(aspect, authentication, web, errorHandler)
            .handle(AppRoutes(lifetime, appdata))
            .handle(SettingRoutes(allServices.settingImport, allServices.settingSource, allServices.settingAppdata))
            .handle(QueryRoutes(allServices.queryService))
            .handle(IllustRoutes(allServices.illust))
            .handle(AlbumRoutes(allServices.album))
            .handle(FolderRoutes(allServices.folder))
            .handle(PartitionRoutes(allServices.partition))
            .handle(ImportRoutes(allServices.import))
            .handle(TagRoutes(allServices.tag))
            .handle(TopicRoutes(allServices.topic))
            .handle(AuthorRoutes(allServices.author))
            .handle(AnnotationRoutes(allServices.annotation))
            .bind()
    }

    override val isIdle: Boolean //当web可访问且打开了web的永久访问开关时，http server标记为忙，使进程不会退出
        get() = !(webController.isAccess && appdata.data.web.permanent)

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

        val port = ports.firstOrNull { Net.isPortAvailable(it) } ?: throw BindException("Server starting failed because no port is available.")
        try {
            this.start(port)
            this@HttpServerImpl.port = port
            health.save(port = port, token = token)
            return this
        }catch (e: BindException) {
            throw BindException("Binding port $port failed: ${e.message}")
        }
    }
}

interface Endpoints {
    fun handle(javalin: Javalin)
}