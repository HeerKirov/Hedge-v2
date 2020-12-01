package com.heerkirov.hedge.server.framework

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.lang.RuntimeException
import java.util.*
import kotlin.collections.ArrayList
import kotlin.concurrent.thread
import kotlin.reflect.KClass
import kotlin.reflect.full.allSuperclasses
import kotlin.system.exitProcess

class Framework {
    private val log: Logger = LoggerFactory.getLogger(Framework::class.java)

    private val components: MutableList<Component> = LinkedList()

    private val context = FrameworkContextImpl()

    private val exceptions: MutableList<Exception> = ArrayList()

    init {
        log.info("Start hedge server.")

        Runtime.getRuntime().addShutdownHook(thread(name = "shutdown", start = false) {
            log.info("Shutdown.")
            components.asReversed().forEach { it.close() }
        })
    }

    /**
     * 增加一个新的component。
     */
    fun <T : Component> addComponent(call: (context: FrameworkContext) -> T): Framework {
        components.add(call(context))
        return this
    }

    /**
     * 取得一个已注册的component。
     */
    fun <T : Component> getComponent(target: KClass<T>): T {
        for (component in components) {
            val clazz = component::class
            if(target == clazz || clazz.allSuperclasses.any { it == target }) {
                @Suppress("UNCHECKED_CAST")
                return component as T
            }
        }
        throw RuntimeException("Component $target not found in framework.")
    }

    /**
     * 取得全部已注册的component。
     */
    fun getComponents(): List<Component> {
        return components
    }

    /**
     * 开始执行服务。
     * 首先调用load方法，将各个组件初始化。
     * 随后调用线程组件。
     */
    fun start() {
        components.forEach { it.load() }
        components.filterIsInstance<DaemonThreadComponent>()
            .map { Pair(it, thread { it.thread() }) }
            .filter { (c, _) -> c is ThreadComponent }
            .map { (_, t) -> t }
            .forEach { it.join() }
        //最后发送关闭指令
        //不沿执行流程自动退出是因为其他组件可能持有非背景线程，这些线程会阻止shutdown的发生。
        exitProcess(0)
    }

    inner class FrameworkContextImpl : FrameworkContext {
        override fun <T : Component> getComponent(clazz: KClass<T>): T = this@Framework.getComponent(clazz)

        override fun getComponents(): List<Component> = this@Framework.getComponents()

        override fun getExceptions(): List<Exception> = this@Framework.exceptions
    }
}