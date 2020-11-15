package com.heerkirov.hedge.server.components.appdata

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.framework.Component
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
     * 程序启动时，加载appdata的状态。如果数据存在，将其加载到内存；如果不存在，记为未初始化的状态。
     */
    fun load()
    /**
     * 目前的加载状态。
     */
    val status: LoadStatus
    /**
     * 在数据未初始化时可以调用，初始化数据。
     */
    fun init(dbPath: String)
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

data class AppdataOptions(
    val channel: String,
    val userDataPath: String
)

class AppDataDriverImpl(private val repository: DataRepository, options: AppdataOptions) : AppDataDriver {
    private val appDataPath = "${options.userDataPath}/${Filename.CHANNEL}/${options.channel}/${Filename.DATA_DAT}"
    private val versionLockPath = "${options.userDataPath}/${Filename.CHANNEL}/${options.channel}/${Filename.VERSION_LOCK}"

    private var loadStatus: LoadStatus? = null
    private var appdata: AppData? = null

    override val status: LoadStatus get() = loadStatus ?: throw RuntimeException("Appdata is not loaded yet.")

    override val data: AppData get() = appdata ?: throw RuntimeException("Appdata is not loaded yet.")

    override fun load() {
        val appdataFile = Fs.readText(appDataPath)
        if(appdataFile == null) {
            this.loadStatus = LoadStatus.NOT_INIT
        }else{
            this.loadStatus = LoadStatus.LOADING
            VersionFileMigrator(versionLockPath).use {
                it.migrate(appdataFile, AppDataMigrationStrategy).let { (d, changed) ->
                    if(changed) { Fs.writeText(appDataPath, d.toJSONString()) }
                    appdata = d
                }
            }
            this.repository.loadDatabase(appdata!!.db.path)
            this.loadStatus = LoadStatus.LOADED
        }
    }

    @Synchronized override fun init(dbPath: String) {
        if(loadStatus != LoadStatus.NOT_INIT) { throw RuntimeException("Appdata status must be NOT_INIT.") }

        this.loadStatus = LoadStatus.LOADING

        try {
            VersionFileMigrator(versionLockPath).use {
                it.migrate(null, AppDataMigrationStrategy).let { (d, changed) ->
                    if(changed) { Fs.writeText(appDataPath, d.toJSONString()) }
                    appdata = d
                }
            }
            appdata!!.db.path = dbPath

            Fs.writeFile(appDataPath, appdata)

            this.repository.loadDatabase(appdata!!.db.path)

            this.loadStatus = LoadStatus.LOADED
        }catch (e: Throwable) {
            Fs.rm(appDataPath)

            appdata = null
            loadStatus = LoadStatus.NOT_INIT

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