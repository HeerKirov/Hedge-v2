package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.http.Endpoints
import io.javalin.Javalin
import io.javalin.http.ContentType
import io.javalin.http.Context

class Encoding : Endpoints {
    override fun handle(javalin: Javalin) {
        javalin.before("/api/*", ::encodingCharset)
        javalin.before("/app/*", ::encodingCharset)
        javalin.before("/web/*", ::encodingCharset)
    }

    private fun encodingCharset(ctx: Context) {
        // 这个module用来暂时处理javalin 4.0.x的一个bug。
        // 当使用json时，内容的charset被设置为ISO-8859-1，因此对UTF-8字符的序列化失败。
        // 为此，手动在序列化之前，设置contentType，以影响charset。
        ctx.contentType(ContentType.APPLICATION_JSON)
    }
}