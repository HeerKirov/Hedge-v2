package com.heerkirov.hedge.server.components.database

import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.framework.Component
import me.liuwj.ktorm.database.Database
import java.lang.RuntimeException

/**
 * 对接数据库的实现。
 * 与其他组件不同，不在主线程中参与初始化。由appdata模块调用加载。
 * 1. 提供database实例，供ORM调用。
 * 2. 提供对元数据部分的读写。
 */
interface DataRepository : Component {
    /**
     * 指定一个路径，加载此路径上的数据库，如果不存在就初始化。此方法一般由appDataDriver调用，或者由初始化流程调用。
     */
    fun loadDatabase(dbPath: String)
    /**
     * 目前的初始化状态。
     */
    val status: LoadStatus
    /**
     * 当前的数据库路径。如果没有初始化会抛出异常。
     */
    val dbPath: String
    /**
     * 取得db连接。
     */
    val db: Database
}

data class DataOptions(
    val channel: String,
    val userDataPath: String
)

class DataRepositoryImpl(options: DataOptions) : DataRepository {
    private var instance: DBInstance? = null

    private var statusRef: LoadStatus = LoadStatus.NOT_INIT

    override val status: LoadStatus get() = statusRef

    override val dbPath: String get() = instance?.dbPath ?: throw RuntimeException("DB is not loaded yet.")

    override val db: Database get() = instance?.database ?: throw RuntimeException("DB is not loaded yet.")

    @Synchronized
    override fun loadDatabase(dbPath: String) {
        if(statusRef != LoadStatus.NOT_INIT) {
            throw RuntimeException("DB status must be NOT_INIT.")
        }
        statusRef = LoadStatus.LOADING
        instance = DBInstance(dbPath)
        statusRef = LoadStatus.LOADED
    }
}