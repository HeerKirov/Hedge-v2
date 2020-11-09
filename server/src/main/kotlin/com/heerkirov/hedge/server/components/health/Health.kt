package com.heerkirov.hedge.server.components.health

import com.heerkirov.hedge.server.framework.Component
import com.heerkirov.hedge.server.framework.FrameworkContext
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.utils.Fs
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.system.exitProcess

/**
 * 负责健康状况检查和监视的组件。
 * 1. 封装对server.pid文件的读写。
 * 2. 应用程序启动时检测重复的进程。
 * 3. 可查询应用程序的初始化和创建状态。
 */
interface Health : Component {
    fun save(port: Int? = null, token: String? = null): Health
}

class HealthOptions(
    val channel: String,
    val userDataPath: String
)

class HealthImpl(private val context: FrameworkContext, options: HealthOptions) : Health {
    private val log: Logger = LoggerFactory.getLogger(HealthImpl::class.java)

    private val channelPath = "${options.userDataPath}/${Filename.CHANNEL}/${options.channel}"
    private val pidPath: String = "${channelPath}/${Filename.SERVER_PID}"

    private val pid: Long = ProcessHandle.current().pid()
    private val model: ServerPID

    init {
        checkCurrentProcess()
        model = ServerPID(pid, null, null, null)
        save()
    }

    private fun checkCurrentProcess() {
        Fs.mkdir(channelPath)
        val f = Fs.readFile<ServerPID>(pidPath)
        if(f != null && f.pid != pid && ProcessHandle.of(f.pid).isPresent) {
            log.info("Hedge server has been running with PID ${f.pid}.")
            exitProcess(0)
        }
    }

    override fun save(port: Int?, token: String?): HealthImpl {
        if(port != null) { model.port = port }
        if(token != null) { model.token = token }
        Fs.writeFile(pidPath, model)
        return this
    }

    override fun close() {
        if(context.getExceptions().isNotEmpty()) {
            model.errors = context.getExceptions().mapNotNull { e -> e.message }
            save(null, null)
        }else{
            Fs.rm(pidPath)
        }
    }
}