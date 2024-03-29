package com.heerkirov.hedge.server.components.http.modules

import com.heerkirov.hedge.server.components.appdata.AppDataDriver
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.http.Endpoints
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.NotInit
import com.heerkirov.hedge.server.exceptions.be
import io.javalin.Javalin
import io.javalin.http.Context

/**
 * 通用拦截模块。
 * 如果server未初始化，拦截所有的业务API，并告知。因此对appdata、database等的初始化验证在大部分handler中都可以省略。
 */
class Aspect(private val appdata: AppDataDriver, private val repo: DataRepository) : Endpoints {
    @Volatile
    private var loaded: Boolean = false

    override fun handle(javalin: Javalin) {
        javalin.before("/web", ::aspectByInit)
            .before("/api", ::aspectByInit)
    }

    private fun aspectByInit(ctx: Context) {
        if(!loaded) {
            if(appdata.status == LoadStatus.LOADED && repo.status == LoadStatus.LOADED) {
                loaded = true
            }else{
                throw be(NotInit())
            }
        }
    }
}