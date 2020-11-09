package com.heerkirov.hedge.server.framework

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.concurrent.thread
import kotlin.reflect.KClass

class Framework {
    private val log: Logger = LoggerFactory.getLogger(Framework::class.java)

    private val components: MutableMap<KClass<out Component>, Component> = LinkedHashMap()

    private val context = FrameworkContextImpl()

    private val exceptions: MutableList<Exception> = ArrayList()

    init {
        log.info("Start hedge server.")

        Runtime.getRuntime().addShutdownHook(thread(name = "shutdown", start = false) {
            log.info("Shutdown.")
            getComponents().asReversed().forEach { it.close() }
        })
    }

    /**
     * 增加一个新的component。
     */
    fun <T : Component> addComponent(clazz: KClass<T>, call: (context: FrameworkContext) -> T): Framework {
        components[clazz] = call(context)
        return this
    }

    /**
     * 取得一个已注册的component。
     */
    fun <T : Component> getComponent(clazz: KClass<T>): T {
        @Suppress("UNCHECKED_CAST")
        return components[clazz] as T
    }

    /**
     * 取得全部已注册的component。
     */
    fun getComponents(): List<Component> {
        return components.values.toList()
    }

    /**
     * 取得目标component并执行一段代码。
     */
    fun <T : Component> then(clazz: KClass<T>, call: T.() -> Unit): Framework {
        if(exceptions.isEmpty()) {
            try {
                call(context.getComponent(clazz))
            }catch (e: Exception) {
                exceptions.add(e)
            }
        }
        return this
    }

    /**
     * 执行一段代码。
     */
    fun then(call: (context: FrameworkContext) -> Unit): Framework {
        if(exceptions.isEmpty()) {
            try {
                call(context)
            }catch (e: Exception) {
                exceptions.add(e)
            }
        }
        return this
    }

    inner class FrameworkContextImpl : FrameworkContext {
        override fun <T : Component> getComponent(clazz: KClass<T>): T = this@Framework.getComponent(clazz)

        override fun getComponents(): List<Component> = this@Framework.getComponents()

        override fun getExceptions(): List<Exception> = this@Framework.exceptions
    }
}