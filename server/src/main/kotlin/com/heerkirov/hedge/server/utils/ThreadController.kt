package com.heerkirov.hedge.server.utils

import kotlin.concurrent.thread

class ThreadController(start: Boolean = false, private val call: () -> Unit) {
    private var thread: Thread? = null

    init {
        if(start) {
            this.start()
        }
    }

    /**
     * 查看任务的活跃状态。
     */
    var isAlive: Boolean = false
        private set

    /**
     * 启动任务。
     */
    fun start() {
        synchronized(this) {
            if(!isAlive) {
                this.thread = thread(isDaemon = true, block = ::loop)
                isAlive = true
            }
        }
    }

    /**
     * 停止任务。
     * @param force 强制关闭任务，这将使用interrupt打断线程。
     */
    fun stop(force: Boolean = false) {
        synchronized(this) {
            if(isAlive) {
                isAlive = false

                val thread = this.thread
                if(force && thread != null && thread.isAlive) {
                    thread.interrupt()
                }
                this.thread = null
            }
        }
    }

    private fun loop() {
        while(isAlive) {
            try {
                call()
            }catch(e: Exception) {
                isAlive = false
                throw e
            }
        }
    }
}

/**
 * 产生一个受控线程。这是一个长期任务类的持久化线程，被控制器控制启动或停止。
 * @param thread 任务启动后，call函数将作为daemon thread无限运行。
 */
fun controlledThread(start: Boolean = false, thread: () -> Unit): ThreadController {
    return ThreadController(start, thread)
}