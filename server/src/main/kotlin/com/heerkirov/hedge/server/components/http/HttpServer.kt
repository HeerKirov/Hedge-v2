package com.heerkirov.hedge.server.components.http

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.health.Health
import com.heerkirov.hedge.server.components.http.modules.*
import com.heerkirov.hedge.server.components.http.routes.*
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.components.service.AllServices
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.utils.Net
import com.heerkirov.hedge.server.utils.Token
import com.heerkirov.hedge.server.utils.objectMapper
import io.javalin.Javalin
import io.javalin.http.ContentType
import io.javalin.plugin.json.JavalinJackson
import io.javalin.plugin.json.JsonMapper
import java.net.BindException

interface HttpServer : StatefulComponent {
    /**
     * 启动HTTP server。
     */
    override fun load()
}

class HttpServerOptions(
    /**
     * 前端资源路径。
     */
    val frontendPath: String,
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
                     private val repo: DataRepository,
                     private val webController: WebController,
                     private val options: HttpServerOptions) : HttpServer {
    private val token: String = options.forceToken ?: Token.token()
    private var port: Int? = null

    private var server: Javalin? = null

    private val web = WebAccessor(appdata, webController, options.frontendPath)

    override fun load() {
        val aspect = Aspect(appdata, repo)
        val authentication = Authentication(token, web, webController)
        val errorHandler = ErrorHandler()
        val encoding = Encoding()

        server = Javalin
            .create {
                it.showJavalinBanner = false
                it.enableCorsForAllOrigins()
                it.jsonMapper(JavalinJackson(objectMapper()))
                web.configure(it)
            }
            .handle(aspect, authentication, web, errorHandler, encoding)
            .handle(AppRoutes(lifetime, appdata, repo))
            .handle(SettingRoutes(
                allServices.settingMeta,
                allServices.settingQuery,
                allServices.settingImport,
                allServices.settingSource,
                allServices.settingSpider,
                allServices.settingAppdata))
            .handle(UtilQueryRoutes(allServices.queryService))
            .handle(UtilMetaRoutes(allServices.metaService))
            .handle(IllustRoutes(allServices.illust, allServices.associate))
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
        val ports = options.forcePort?.let { listOf(it) }
            ?: appdata.data.service.port?.let { Net.analyzePort(it) }
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