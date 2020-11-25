package com.heerkirov.hedge.server.application

import com.heerkirov.hedge.server.components.appdata.AppDataDriverImpl
import com.heerkirov.hedge.server.components.appdata.AppdataOptions
import com.heerkirov.hedge.server.components.database.DataOptions
import com.heerkirov.hedge.server.components.database.DataRepositoryImpl
import com.heerkirov.hedge.server.framework.Framework
import com.heerkirov.hedge.server.components.health.HealthImpl
import com.heerkirov.hedge.server.components.health.HealthOptions
import com.heerkirov.hedge.server.components.http.HttpServerImpl
import com.heerkirov.hedge.server.components.http.HttpServerOptions
import com.heerkirov.hedge.server.components.lifetime.LifetimeImpl
import com.heerkirov.hedge.server.components.lifetime.LifetimeOptions
import com.heerkirov.hedge.server.framework.getComponent

/**
 * 应用程序的入口类。在这里实例化装配框架，并对整个应用程序进行装配。
 * 实质上是一个函数。
 */
class Application(options: ApplicationOptions) {
    init {
        Framework()
            .addComponent { ctx -> HealthImpl(ctx, HealthOptions(options.channel, options.userDataPath)) }
            .addComponent { ctx -> LifetimeImpl(ctx, LifetimeOptions(options.permanent)) }
            .addComponent { DataRepositoryImpl(DataOptions(options.channel, options.userDataPath)) }
            .addComponent { ctx -> AppDataDriverImpl(
                ctx.getComponent(),
                AppdataOptions(options.channel, options.userDataPath)) }
            .addComponent { ctx -> HttpServerImpl(
                ctx.getComponent(),
                ctx.getComponent(),
                ctx.getComponent(),
                HttpServerOptions(options.userDataPath, options.frontendFromFolder, options.forceToken, options.forcePort)) }
            .start()
    }
}