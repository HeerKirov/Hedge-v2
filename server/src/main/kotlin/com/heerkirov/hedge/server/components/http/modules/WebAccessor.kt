package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.PasswordWrong
import com.heerkirov.hedge.server.exceptions.Reject
import com.heerkirov.hedge.server.utils.Resources
import com.heerkirov.hedge.server.utils.Token
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.*
import io.javalin.core.JavalinConfig
import io.javalin.http.Context
import io.javalin.http.staticfiles.Location
import java.util.*
import kotlin.collections.HashSet


/**
 * Web访问模块。
 * 1. 提供静态文件访问支持和HTML页面的访问支持。
 * 2. 维护web访问开关。
 * 3. 提供web登录相关的专有API。
 * 4. 维护web登录的token组。
 */
class WebAccessor(private val appdata: AppDataDriver, private val frontendPath: String) : Endpoints {
    val tokens: MutableSet<String> = Collections.synchronizedSet(HashSet())

    var isAccess: Boolean = false

    /**
     * 初始化，并给javalin添加几项配置项。
     */
    fun configure(javalinConfig: JavalinConfig) {
        if(if(appdata.status == LoadStatus.LOADED) { appdata.data.web.autoWebAccess }else{ false }) {
            isAccess = true
        }

        javalinConfig.addStaticFiles("/${Filename.STATIC_FOLDER}", "${frontendPath}/${Filename.STATIC_FOLDER}", Location.EXTERNAL)
        javalinConfig.addStaticFiles("/${Filename.FAVICON_ICO}", "${frontendPath}/${Filename.FAVICON_ICO}", Location.EXTERNAL)
    }

    override fun handle(javalin: Javalin) {
        javalin.routes {
            get("/", this::index)
            path("web") {
                get("access", this::webAccess)
                post("login", this::webLogin)
                post("verify-token", this::webVerifyToken)
            }
        }
    }

    private fun index(ctx: Context) {
        if(isAccess) {
            ctx.html(Resources.getFileAsText("$frontendPath/${Filename.FRONTEND_INDEX}"))
        }else{
            ctx.html(Resources.getResourceAsText("/forbidden.html"))
        }
    }

    private fun webAccess(ctx: Context) {
        val password = appdata.data.web.password

        ctx.json(AccessResponse(access = isAccess, needPassword = password != null))
    }

    private fun webLogin(ctx: Context) {
        if(!isAccess) { throw Reject("Web access is not open.") }
        val form = ctx.body<LoginForm>()
        val password = appdata.data.web.password
        if(form.password == password) {
            val token = Token.webToken().also { tokens.add(it) }

            ctx.json(TokenForm(token = token))
        }else{
            throw PasswordWrong()
        }
    }

    private fun webVerifyToken(ctx: Context) {
        if(!isAccess) { throw Reject("Web access is not open.") }

        val form = ctx.body<TokenForm>()

        ctx.json(TokenResponse(ok = form.token in tokens))
    }

    private data class LoginForm(val password: String)

    private data class TokenForm(val token: String)

    private data class AccessResponse(val access: Boolean, val needPassword: Boolean)

    private data class TokenResponse(val ok: Boolean)
}