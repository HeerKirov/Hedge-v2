package com.heerkirov.hedge.server.components.appdata

import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.migrations.VersionFileMigrator
import com.heerkirov.hedge.server.utils.toJSONString

/**
 * 与appdata中的`data.dat`数据文件对接dao层组件。
 * 1. 检测此文件的初始化状态，并可作为server的整体初始化状态。
 * 2. 初始化，将初始数据写入此文件，或者从已存在的文件中读取数据并缓存。
 * 3. 获取缓存的数据内容，或者更新数据并将数据写入文件。
 */
interface AppDataDriver : Component {
    /**
     * 程序启动时，加载appdata的状态。如果数据存在，将其加载到内存；如果不存在，则进行初始化操作。
     */
    override fun load()
    /**
     * 目前的加载状态。
     */
    val status: LoadStatus
    /**
     * 获得数据。
     */
    val data: AppData
    /**
     * 保存数据。
     * @param call 在保存之前对appdata做修改
     */
    fun save(call: (AppData.() -> Unit)? = null)
}

class AppDataDriverImpl(channelPath: String) : AppDataDriver {
    private val appDataPath = "$channelPath/${Filename.DATA_DAT}"
    private val versionLockPath = "$channelPath/${Filename.VERSION_LOCK}"

    private var loadStatus: LoadStatus = LoadStatus.LOADING
    private var appdata: AppData? = null

    override val status: LoadStatus get() = loadStatus

    override val data: AppData get() = appdata ?: throw RuntimeException("Appdata is not loaded yet.")

    override fun load() {
        this.loadStatus = LoadStatus.LOADING
        val appdataFile = Fs.readText(appDataPath)

        try {
            VersionFileMigrator(versionLockPath).use {
                it.migrate(appdataFile, AppDataMigrationStrategy).let { (d, changed) ->
                    if(changed) { Fs.writeText(appDataPath, d.toJSONString()) }
                    appdata = d
                }
            }
            Fs.writeFile(appDataPath, appdata)

            loadStatus = LoadStatus.LOADED
        }catch (e: Throwable) {
            if(appdataFile == null) Fs.rm(appDataPath)

            appdata = null

            throw e
        }
    }

    override fun save(call: (AppData.() -> Unit)?) {
        if(appdata == null) { throw RuntimeException("Appdata is not initialized.") }
        if(call != null) {
            appdata?.call()
        }
        Fs.writeFile(appDataPath, appdata!!)
    }
}