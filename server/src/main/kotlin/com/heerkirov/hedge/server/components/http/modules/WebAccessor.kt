package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.appdata.AppDataRepository
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.utils.Resources
import io.javalin.Javalin
import io.javalin.core.JavalinConfig
import io.javalin.http.Context
import io.javalin.http.staticfiles.Location

class WebAccessor(private val appdata: AppDataRepository, private val frontendPath: String) : Endpoints {
    private var isAccess: Boolean = false

    /**
     * 初始化，并给javalin添加几项配置项。
     */
    fun configure(javalinConfig: JavalinConfig) {
        if(if(appdata.status == LoadStatus.LOADED) { appdata.getAppData().web.autoWebAccess }else{ false }) {
            isAccess = true
        }

        javalinConfig.addStaticFiles("/${Filename.STATIC_FOLDER}", "${frontendPath}/${Filename.STATIC_FOLDER}", Location.EXTERNAL)
        javalinConfig.addStaticFiles("/${Filename.FAVICON_ICO}", "${frontendPath}/${Filename.FAVICON_ICO}", Location.EXTERNAL)
    }

    override fun handle(javalin: Javalin) {
        javalin
            .get("/", this::index)
            .post("/web/login", this::webLogin)
            .post("/web/verify-token", this::webVerifyToken)
    }

    private fun index(ctx: Context) {
        if(isAccess) {
            ctx.html(Resources.getFileAsText("$frontendPath/${Filename.FRONTEND_INDEX}"))
        }else{
            ctx.html(Resources.getResourceAsText("/forbidden.html"))
        }
    }

    private fun webLogin(ctx: Context) {
        val form = ctx.bodyAsClass(LoginForm::class.java)
    }

    private fun webVerifyToken(ctx: Context) {

    }

    private data class LoginForm(val password: String)

    private data class LoginResponse(val token: String)
}