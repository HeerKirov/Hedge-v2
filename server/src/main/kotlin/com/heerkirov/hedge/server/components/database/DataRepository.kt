package com.heerkirov.hedge.server.components.database

import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.Component
import me.liuwj.ktorm.database.Database
import me.liuwj.ktorm.database.Transaction
import me.liuwj.ktorm.database.TransactionIsolation
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
     * 取得db连接。使用此连接完成read操作。
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

/**
 * 开始一个事务会话。在业务中，任何write操作，都应使用此包装的会话。不要直接使用Database::useTransaction会话。
 * - 此函数默认使用了level 8的事务级别，以适配SQLite引擎。
 * - 此函数使用了synchronized同步锁，确保全局总是只有单一write调用。为了防止过多的阻塞，纯read的业务不要使用事务。
 */
inline fun <T> Database.transaction(func: (Transaction) -> T): T {
    synchronized(this) {
        return useTransaction(TransactionIsolation.SERIALIZABLE, func)
    }
}