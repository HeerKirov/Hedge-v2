package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.exceptions.NoToken
import com.heerkirov.hedge.server.exceptions.OnlyForClient
import com.heerkirov.hedge.server.exceptions.TokenWrong
import io.javalin.Javalin
import io.javalin.http.Context

/**
 * 登录认证模块。
 * 使用before handler拦截所有需要认证的API，验证其token，检验token是否能访问目标API，然后放通。
 */
class Authentication(private val baseToken: String, private val webAccessor: WebAccessor) : Endpoints {

    override fun handle(javalin: Javalin) {
        javalin.before("/api/*", this::authenticate)
            .before("/app/*", this::authenticateOnlyForClient)
    }

    private fun authenticate(ctx: Context) {
        val bearer = ctx.header("Authorization") ?: throw NoToken()
        val userToken = if(bearer.startsWith("bearer ")) bearer.substring("bearer ".length) else throw NoToken()

        if(baseToken == userToken) {
            //通过baseToken的验证
            return
        }else if(webAccessor.isAccess && userToken in webAccessor.tokens) {
            //web访问开启且通过webToken验证
            return
        }else{
            throw TokenWrong()
        }
    }

    private fun authenticateOnlyForClient(ctx: Context) {
        val bearer = ctx.header("Authorization") ?: throw NoToken()
        val userToken = if(bearer.startsWith("bearer ")) bearer.substring("bearer ".length) else throw NoToken()

        if(baseToken == userToken) {
            //通过baseToken的验证
            return
        }else if(webAccessor.isAccess && userToken in webAccessor.tokens) {
            //web访问开启且通过webToken验证，但是此API不提供给web访问
            throw OnlyForClient()
        }else{
            throw TokenWrong()
        }
    }
}