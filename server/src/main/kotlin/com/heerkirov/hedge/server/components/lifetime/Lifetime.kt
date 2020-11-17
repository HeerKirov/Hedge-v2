package com.heerkirov.hedge.server.components.lifetime

import com.heerkirov.hedge.server.framework.Component
import com.heerkirov.hedge.server.framework.FrameworkContext
import com.heerkirov.hedge.server.framework.StatefulComponent
import com.heerkirov.hedge.server.utils.Token
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import kotlin.system.exitProcess

/**
 * 负责生命周期维持的组件。因为server一般不允许无限制地在后台运行，就需要各种机制来配合web、client、cli，确保它们在使用时server不会退出。
 * 1. 提供注册+心跳机制。client注册一个存在ID，并需要按要求隔一段时间发送一个心跳信号。收不到心跳，或收到一个撤销信号时移除此存在序号。
 * 3. 除此之外，生命周期维持还要看其他组件的空闲情况。每过一段时间检查其他有状态组件是否空闲，所有有状态组件都空闲时才允许退出。
 * 4. 最后，还允许用户直接将此组件设定为永久持续。
 */
interface Lifetime : Component {
    /**
     * 生命周期维持组件被标记为永久存续。如果标记为真，那么无视其他一切生命周期信号，永久保持运行。
     */
    var permanent: Boolean

    /**
     * 注册一个新的客户端。
     * @param interval 此客户端的心跳信号时长。未指定时使用默认值。
     * @return 新客户端的响应id。
     */
    fun register(interval: Long? = null): String

    /**
     * 接收一个客户端的心跳信号。
     * 如果此客户端id不存在，会直接创建此客户端。如果此时没有指定interval会使用默认值。
     * @param lifetimeId 客户端id
     * @param interval 更新心跳时间为一个新数字
     */
    fun heart(lifetimeId: String, interval: Long? = null)

    /**
     * 移除一个客户端。
     * @param lifetimeId 客户端id
     */
    fun unregister(lifetimeId: String)

    /**
     * 接收一个瞬时的心跳信号。
     * @param interval 此心跳信号的有效时长。
     */
    fun signal(interval: Long)

    /**
     * 启动生命周期维持线程。使用此方法阻塞主线程。
     */
    fun thread()
}

data class LifetimeOptions(
    val permanent: Boolean = false,
    val defaultInterval: Long = 1000L * 60,
    val threadInterval: Long = 1000L * 10,
    val threadContinuousCount: Int = 1
)

class LifetimeImpl(private val context: FrameworkContext, private val options: LifetimeOptions) : Lifetime {
    private val log: Logger = LoggerFactory.getLogger(LifetimeImpl::class.java)

    private val lifetimes: MutableMap<String, LifetimeRow> = ConcurrentHashMap()
    private val signals: MutableList<Long> = LinkedList()

    override var permanent: Boolean = options.permanent

    override fun register(interval: Long?): String {
        val id = Token.uuid()
        val now = System.currentTimeMillis()
        val realInterval = interval ?: options.defaultInterval
        lifetimes[id] = LifetimeRow(now + realInterval, realInterval)
        return id
    }

    override fun heart(lifetimeId: String, interval: Long?) {
        val now = System.currentTimeMillis()

        val lifetimeRow = lifetimes[lifetimeId]
        if(lifetimeRow != null) {
            if(interval != null) { lifetimeRow.interval = interval }
            lifetimeRow.timestamp = now + lifetimeRow.interval
        }else{
            val realInterval = interval ?: options.defaultInterval
            lifetimes[lifetimeId] = LifetimeRow(now + realInterval, realInterval)
        }
    }

    override fun unregister(lifetimeId: String) {
        lifetimes.remove(lifetimeId)
    }

    override fun signal(interval: Long) {
        synchronized(signals) {
            signals.add(System.currentTimeMillis() + interval)
        }
    }

    override fun thread() {
        val statefulComponents = context.getComponents().filterIsInstance<StatefulComponent>()

        var continuous = 0
        while (true) {
            Thread.sleep(options.threadInterval)
            //进行信号清理
            val now = System.currentTimeMillis()
            if(lifetimes.isNotEmpty()) {
                for ((id, row) in lifetimes.entries) {
                    val (timestamp, _) = row
                    if(timestamp <= now) {
                        lifetimes.remove(id)
                    }
                }
            }
            if(signals.isNotEmpty()) {
                synchronized(signals) {
                    val iter = signals.listIterator()
                    while (iter.hasNext()) {
                        val signal = iter.next()
                        if(signal <= now) {
                            iter.remove()
                        }
                    }
                }
            }

            if(anySignal(statefulComponents)) {
                //存在任意一种信号响应，就继续循环
                if(continuous > 0) {
                    log.info("New signal found in lifetime. Subsisting state is exited.")
                    continuous = 0
                }
                continue
            }else{
                if(continuous == 0) {
                    log.info("No signal exists in lifetime. It will be into subsisting state as most ${options.threadInterval * options.threadContinuousCount}ms.")
                }
                //不存在就进入存续期
                continuous += 1
                //在存续期进入N次都没有新的信号后，退出阻塞线程，程序终止
                if(continuous > options.threadContinuousCount) { break }
            }
        }
        //最后发送关闭指令。
        //不沿执行流程自动退出是因为其他组件可能持有非背景线程，这些线程会阻止shutdown的发生。
        exitProcess(0)
    }

    private fun anySignal(statefulComponents: List<StatefulComponent>): Boolean {
        if(permanent) {
            //在开启永久模式时，不会执行其他判断，总是继续循环
            return true
        }else if(lifetimes.isNotEmpty() || signals.isNotEmpty()) {
            //还存在未过期的信号，意味着继续执行
            return true
        }else if(statefulComponents.any { !it.isIdle }) {
            //任一有状态组件没有空闲，意味着还有任务在执行
            return true
        }
        return false
    }

    private data class LifetimeRow(var timestamp: Long, var interval: Long)
}