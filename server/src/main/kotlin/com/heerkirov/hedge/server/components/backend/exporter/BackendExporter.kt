package com.heerkirov.hedge.server.components.backend.exporter

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.dao.system.ExporterRecords
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.toJSONString
import com.heerkirov.hedge.server.utils.tools.ControlledLoopThread
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import java.lang.IllegalArgumentException
import java.util.concurrent.atomic.AtomicInteger
import kotlin.reflect.KClass

/**
 * 后台导出各类属性重新计算任务的组件。用于在更新过程中异步处理大量数据的重新导出。
 * 会将持有的任务持久化到数据库。
 */
interface BackendExporter : StatefulComponent {
    fun add(tasks: List<ExporterTask>)
}

sealed interface ExporterTask

/**
 * backend exporter的工作线程。每一类此接口的实现对应一种task类型的工作。每一个线程实例都是单并发的。
 */
sealed interface ExporterWorker<T : ExporterTask> {
    /**
     * 类。
     */
    val clazz: KClass<T>

    /**
     * 将task序列化。
     */
    fun serialize(task: T): String = task.toJSONString()

    /**
     * 将task反序列化。
     */
    fun deserialize(content: String): T = content.parseJSONObject(clazz.java)

    /**
     * 执行针对某个task的处理操作。
     */
    fun run(task: T)
}

/**
 * 可选的worker属性：每个task开始执行之前，都会延迟一段时间。
 */
interface LatencyProcessWorker {
    /**
     * 延迟时间(毫秒)。
     */
    val latency: Long

    /**
     * 如果在等待时被打断，是退出当前task，还是直接开始。
     */
    val breakWhenInterrupted: Boolean get() = true
}

/**
 * 可选的worker属性：尝试合并具有相同key值的项。此属性给出合并策略。
 */
interface MergedProcessWorker<T : ExporterTask> {
    /**
     * 获得一个task的唯一key。
     */
    fun keyof(task: T): String

    /**
     * 对一组task执行合并。
     */
    fun merge(tasks: List<T>): T
}

private val EXPORTER_TYPE_INDEX = listOf(
    IllustMetadataExporterTask::class,
    AlbumMetadataExporterTask::class,
    TagGlobalSortExporterTask::class
)
private val EXPORTER_TYPES = EXPORTER_TYPE_INDEX.mapIndexed { index, kClass -> kClass to index }.toMap()

class BackendExporterImpl(private val data: DataRepository,
                          private val illustKit: IllustKit,
                          private val albumKit: AlbumKit) : BackendExporter {
    private val workerThreads: MutableMap<KClass<out ExporterTask>, ExporterWorkerThread<*>> = mutableMapOf()

    override val isIdle: Boolean get() = workerThreads.values.sumOf { it.taskCount } <= 0

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            //组件加载时，从db加载剩余数量，若存在剩余数量就直接开始daemon task。
            val counts = data.db.from(ExporterRecords)
                .select(ExporterRecords.type, count(ExporterRecords.id).aliased("count"))
                .groupBy(ExporterRecords.type)
                .associate { it[ExporterRecords.type]!! to it.getInt("count") }

            for ((type, count) in counts) {
                if(count > 0) {
                    val thread = getWorkerThread(EXPORTER_TYPE_INDEX[type])
                    thread.load(count)
                }
            }
        }
    }

    override fun add(tasks: List<ExporterTask>) {
        if(tasks.isNotEmpty()) {
            for((clazz, sameClassTasks) in tasks.groupBy { it::class }) {
                @Suppress("UNCHECKED_CAST")
                val thread = getWorkerThread(clazz) as ExporterWorkerThread<ExporterTask>

                thread.add(sameClassTasks)
            }
        }
    }

    private fun <T : ExporterTask> newWorker(type: KClass<T>): ExporterWorker<T> {
        @Suppress("UNCHECKED_CAST")
        return when(type) {
            IllustMetadataExporterTask::class -> IllustMetadataExporter(data, illustKit)
            AlbumMetadataExporterTask::class -> AlbumMetadataExporter(data, albumKit)
            TagGlobalSortExporterTask::class -> TagGlobalSortExporter(data)
            else -> throw IllegalArgumentException("Unsupported task type ${type.simpleName}.")
        } as ExporterWorker<T>
    }

    private fun <T : ExporterTask> getWorkerThread(type: KClass<T>): ExporterWorkerThread<T> {
        synchronized(workerThreads) {
            return if(type in workerThreads) {
                @Suppress("UNCHECKED_CAST")
                workerThreads[type] as ExporterWorkerThread<T>
            }else{
                val worker = ExporterWorkerThread(data, newWorker(type))
                workerThreads[type] = worker
                worker
            }
        }
    }
}

class ExporterWorkerThread<T : ExporterTask>(private val data: DataRepository,
                                             private val worker: ExporterWorker<T>) : ControlledLoopThread() {
    @Suppress("UNCHECKED_CAST")
    private val merge: MergedProcessWorker<T>? = if(worker is MergedProcessWorker<*>) worker as MergedProcessWorker<T> else null
    private val latency: LatencyProcessWorker? = if(worker is LatencyProcessWorker) worker else null
    private val typeIndex = EXPORTER_TYPES[worker.clazz] ?: throw IllegalArgumentException("Cannot find type index of type ${worker.clazz.simpleName}.")

    @Volatile
    private var _currentKey: String? = null
    private val _taskCount = AtomicInteger(0)
    private val _totalTaskCount = AtomicInteger(0)

    val taskCount: Int get() = _taskCount.get()
    val totalTaskCount: Int get() = _totalTaskCount.get()

    fun load(initializeTaskCount: Int) {
        _taskCount.set(initializeTaskCount)
        _totalTaskCount.set(initializeTaskCount)
        if(initializeTaskCount > 0) {
            this.start()
        }
    }

    fun add(tasks: List<T>) {
        val now = DateTime.now()
        data.db.batchInsert(ExporterRecords) {
            //TODO 在merge生效时，处理合并问题。并且如果currentKey也包含在其中，需要打断任务。
            for (task in tasks) {
                item {
                    set(it.type, typeIndex)
                    set(it.key, merge?.keyof(task) ?: "")
                    set(it.content, worker.serialize(task))
                    set(it.createTime, now)
                }
            }
        }

        synchronized(this) {
            _totalTaskCount.addAndGet(tasks.size)
            _taskCount.addAndGet(tasks.size)
            if(!this.isAlive) {
                this.start()
            }
        }
    }

    override fun run() {
        if(_taskCount.get() <= 0) {
            synchronized(this) {
                _totalTaskCount.set(0)
                this.stop()
                return
            }
        }

        val model = data.db.sequenceOf(ExporterRecords).firstOrNull { it.type eq typeIndex }
        if(model == null) {
            this.stop()
            return
        }

        val task = worker.deserialize(model.content)
        merge?.let {
            this._currentKey = it.keyof(task)
        }

        latency?.let {
            try {
                Thread.sleep(it.latency)
            }catch (e: InterruptedException) {
                if(it.breakWhenInterrupted) {
                    return
                }
            }
        }

        try {
            worker.run(task)
        }catch (e: Exception) {

        }

        this._currentKey = null
        data.db.delete(ExporterRecords) { it.id eq model.id }
    }
}
