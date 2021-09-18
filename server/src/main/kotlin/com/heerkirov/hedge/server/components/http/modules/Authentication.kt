package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.components.http.WebController
import com.heerkirov.hedge.server.exceptions.NoToken
import com.heerkirov.hedge.server.exceptions.OnlyForClient
import com.heerkirov.hedge.server.exceptions.RemoteDisabled
import com.heerkirov.hedge.server.exceptions.TokenWrong
import io.javalin.Javalin
import io.javalin.http.Context

/**
 * 登录认证模块。
 * 使用before handler拦截所有需要认证的API，验证其token，检验token是否能访问目标API，然后放通。
 */
class Authentication(private val baseToken: String, private val webAccessor: WebAccessor, private val webController: WebController) : Endpoints {
    private val localhost = setOf("localhost", "127.0.0.1", "::1", "0:0:0:0:0:0:0:1", "[::1]", "[0:0:0:0:0:0:0:1]")
    private val prefixBearer = "bearer "

    override fun handle(javalin: Javalin) {
        javalin.before("/api/*", ::authenticate)
            .before("/app/*", ::authenticateOnlyForClient)
            .before("/api/imports/import", ::authenticateOnlyForClient)
    }

    private fun authenticate(ctx: Context) {
        //对于OPTIONS method放行; 对于/api/imports/import放行，因为它由另一个处理器处理
        if(ctx.method() == "OPTIONS" || ctx.path() == "/api/imports/import") return
        val bearer = ctx.header("Authorization") ?: throw NoToken()
        val userToken = if(bearer.substring(0, prefixBearer.length).lowercase() == prefixBearer) bearer.substring(prefixBearer.length) else throw NoToken()

        if(baseToken == userToken) {
            //通过baseToken的验证
            if(ctx.req.remoteHost !in localhost) {
                throw RemoteDisabled()
            }
            return
        }else if(webController.isAccess && userToken in webAccessor.tokens) {
            //web访问开启且通过webToken验证
            return
        }else{
            throw TokenWrong()
        }
    }

    private fun authenticateOnlyForClient(ctx: Context) {
        if(ctx.method() == "OPTIONS") return
        val bearer = ctx.header("Authorization") ?: throw NoToken()
        val userToken = if(bearer.substring(0, prefixBearer.length).lowercase() == prefixBearer) bearer.substring(prefixBearer.length) else throw NoToken()

        if(baseToken == userToken) {
            //通过baseToken的验证
            if(ctx.req.remoteHost !in localhost) {
                throw RemoteDisabled()
            }
            return
        }else if(webController.isAccess && userToken in webAccessor.tokens) {
            //web访问开启且通过webToken验证，但是此API不提供给web访问
            throw OnlyForClient()
        }else{
            throw TokenWrong()
        }
    }
}