package com.heerkirov.hedge.server.components.configuration

import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.utils.Fs


/**
 * 与appdata中的`public.dat`数据文件对接的dao层组件。
 * 这个文件通常作为通用配置文件，server不会写它，只会在启动时从中读取配置。
 * 通常这个文件是由client或cli来写入的，因此在server启动时应该确保此文件存在且可用，否则server将会报告错误。
 */
interface ConfigurationDriver : Component {
    /**
     * 程序启动时，加载appdata的状态。如果数据存在，将其加载到内存；如果不存在，报告错误。
     */
    override fun load()

    /**
     * 此组件的加载状态。如果为false，表示加载产生异常。
     */
    val status: LoadStatus

    /**
     * 取得实际的dbPath。它由原始配置文件的dbPath生成。
     */
    val dbPath: String
}

class ConfigurationDriverImpl(private val channelPath: String) : ConfigurationDriver {
    private var loadStatus: LoadStatus = LoadStatus.LOADING
    private var _configuration: Configuration? = null

    override fun load() {
        loadStatus = LoadStatus.LOADING
        try {
            _configuration = Fs.readFile<Configuration>("$channelPath/${Filename.PUBLIC_DAT}")
            loadStatus = LoadStatus.LOADED
        }catch (e: Exception) {
            throw e
        }
    }

    override val status: LoadStatus get() = loadStatus

    override val dbPath: String by lazy {
        val dbPath = _configuration?.dbPath ?: throw RuntimeException("Configuration is not loaded yet.")
        if(dbPath.startsWith("@/")) {
            "$channelPath/${dbPath.substring(2)}"
        }else{
            dbPath
        }
    }
}