package com.heerkirov.hedge.server.application

import com.heerkirov.hedge.server.components.appdata.AppDataRepository
import com.heerkirov.hedge.server.components.appdata.AppDataRepositoryImpl
import com.heerkirov.hedge.server.components.appdata.AppdataOptions
import com.heerkirov.hedge.server.framework.Framework
import com.heerkirov.hedge.server.components.health.Health
import com.heerkirov.hedge.server.components.health.HealthImpl
import com.heerkirov.hedge.server.components.health.HealthOptions
import com.heerkirov.hedge.server.components.http.HttpServer
import com.heerkirov.hedge.server.components.http.HttpServerImpl
import com.heerkirov.hedge.server.components.http.HttpServerOptions
import com.heerkirov.hedge.server.components.lifetime.Lifetime
import com.heerkirov.hedge.server.components.lifetime.LifetimeImpl
import com.heerkirov.hedge.server.components.lifetime.LifetimeOptions


/**
 * 应用程序的入口类。在这里实例化装配框架，并对整个应用程序进行装配。
 * 实质上是一个函数。
 */
class Application(options: ApplicationOptions) {
    init {
        Framework()
            .addComponent(Health::class) { ctx -> HealthImpl(ctx, HealthOptions(options.channel, options.userDataPath)) }
            .addComponent(Lifetime::class) { ctx -> LifetimeImpl(ctx, LifetimeOptions(options.permanent)) }
            .addComponent(AppDataRepository::class) { AppDataRepositoryImpl(AppdataOptions(options.channel, options.userDataPath)) }
            .addComponent(HttpServer::class) { ctx -> HttpServerImpl(
                ctx.getComponent(Health::class),
                ctx.getComponent(AppDataRepository::class),
                HttpServerOptions(options.userDataPath, options.frontendFromFolder)) }
            .then(AppDataRepository::class) { load() }
            .then(HttpServer::class) { start() }
            .then(Lifetime::class) {
                thread()
            }
    }
}