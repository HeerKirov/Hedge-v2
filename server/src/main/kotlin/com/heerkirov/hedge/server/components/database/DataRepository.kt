package com.heerkirov.hedge.server.components.database

import com.heerkirov.hedge.server.components.configuration.ConfigurationDriver
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.Component
import org.ktorm.database.Database
import org.ktorm.database.Transaction
import org.ktorm.database.TransactionIsolation
import java.lang.RuntimeException

/**
 * 对接数据库的实现。
 * 与其他组件不同，不在主线程中参与初始化。由appdata模块调用加载。
 * 1. 提供database实例，供ORM调用。
 * 2. 提供对元数据部分的读写。
 */
interface DataRepository : Component {
    /**
     * 加载数据库，并进行初始化和同步。
     */
    override fun load()
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
    /**
     * 获得元数据。也就是那些没有存在数据库里的数据。
     */
    val metadata: Metadata
    /**
     * 保存数据。
     */
    fun saveMetadata()
}

class DataRepositoryImpl(private val configurationDriver: ConfigurationDriver) : DataRepository {
    private var instance: DBInstance? = null

    private var loadStatus: LoadStatus = LoadStatus.LOADING

    override val status: LoadStatus get() = loadStatus

    override val dbPath: String get() = instance?.dbPath ?: throw RuntimeException("DB is not loaded yet.")

    override val db: Database get() = instance?.database ?: throw RuntimeException("DB is not loaded yet.")

    override val metadata: Metadata get() = instance?.metadata ?: throw RuntimeException("DB is not loaded yet.")

    override fun saveMetadata() {
        instance?.saveData() ?: throw RuntimeException("DB is not loaded yet.")
    }

    override fun load() {
        instance = DBInstance(configurationDriver.dbPath)
        loadStatus = LoadStatus.LOADED
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

/**
 * 开始一个对metadata的同步锁，确保全局总是只有单一write调用。
 */
inline fun <T> DataRepository.syncMetadata(func: DataRepository.() -> T): T {
    synchronized(this.metadata) {
        return this.func()
    }
}

/**
 * 保存数据，并在之前执行一段处理代码。
 */
inline fun DataRepository.saveMetadata(call: Metadata.() -> Unit) {
    metadata.call()
    saveMetadata()
}
