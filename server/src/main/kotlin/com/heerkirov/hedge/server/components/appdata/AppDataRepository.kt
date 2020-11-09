package com.heerkirov.hedge.server.components.appdata

import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.framework.Component
import com.heerkirov.hedge.server.utils.Fs

/**
 * 与appdata中的`data.dat`数据文件对接dao层组件。
 * 1. 检测此文件的初始化状态，并可作为server的整体初始化状态。
 * 2. 初始化，将初始数据写入此文件，或者从已存在的文件中读取数据并缓存。
 * 3. 获取缓存的数据内容，或者更新数据并将数据写入文件。
 */
interface AppDataRepository : Component {
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
    fun getAppData(): AppData
    /**
     * 保存数据。
     * @param call 在保存之前对appdata做修改
     */
    fun saveAppData(call: (AppData.() -> Unit)? = null)
}

data class AppdataOptions(
    val channel: String,
    val userDataPath: String
)

class AppDataRepositoryImpl(options: AppdataOptions) : AppDataRepository {
    private val appDataPath = "${options.userDataPath}/${Filename.CHANNEL}/${options.channel}/${Filename.DATA_DAT}"

    private var loadStatus: LoadStatus? = null
    private var appData: AppData? = null

    override fun load() {
        appData = Fs.readFile<AppData>(appDataPath)
        loadStatus = if(appData != null) { LoadStatus.LOADED }else{ LoadStatus.NOT_INIT }
    }

    override val status: LoadStatus get() = loadStatus ?: throw RuntimeException("Appdata is not loaded yet.")

    override fun init(dbPath: String) {
        if(loadStatus != LoadStatus.NOT_INIT) { throw RuntimeException("Appdata status must be NOT_INIT.") }

        loadStatus = LoadStatus.LOADING
        appData = defaultValue(dbPath = dbPath)
        Fs.writeFile(appDataPath, appData!!)

        loadStatus = LoadStatus.LOADED
    }

    override fun getAppData(): AppData = appData ?: throw RuntimeException("Appdata is not loaded yet.")

    override fun saveAppData(call: (AppData.() -> Unit)?) {
        if(appData == null) { throw RuntimeException("Appdata is not initiailized.") }
        if(call != null) {
            appData?.call()
        }
        Fs.writeFile(appDataPath, appData!!)
    }
}