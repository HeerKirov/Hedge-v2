package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.system.ExporterTasks
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.model.system.ExporterTask
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.controlledThread
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.count
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import java.time.LocalDateTime
import java.util.concurrent.atomic.AtomicInteger

/**
 * 处理元信息重导出的后台任务。适用于处理大批量重新导出的情况。
 * 会将持有的任务持久化到数据库。
 */
interface IllustMetaExporter : StatefulComponent {
    /**
     * 添加一个新的任务。
     * - 更新collection的score/meta导出属性。可细化到哪几项。
     *      - 由于子项变动——发生在collection子项编辑。
     *      - 或由于子项修改——发生在image编辑联动影响parent。
     * - 更新collection的file相关/score/meta。由于子项变动——创建image并指定parent。
     */
    fun appendNewTask(task: MetaExporterTask) {
        appendNewTask(listOf(task))
    }

    /**
     * 添加新的任务。
     * - 更新image的score/description/meta。
     *      - 发生在collection编辑子项，将image从子项移除。
     *      - 或发生在collection删除，从而相当于移除全部image。
     * - 更新image的score/description/meta。可细化到哪几项。
     *      - 发生在collection编辑，联动影响所有子项。
     * - 更新image/album的tag。
     *      - 发生在tag编辑或删除，联动影响所有关联项。
     */
    fun appendNewTask(tasks: Collection<MetaExporterTask>)
}

/**
 * 一个任务记录单元，标记要执行重导出的对象的种类和id。
 */
abstract class MetaExporterTask(val id: Int)

/**
 * illust的通用任务单元。
 */
open class IllustExporterTask(id: Int, val exportScore: Boolean = false, val exportMeta: Boolean = false) : MetaExporterTask(id)

/**
 * collection的专项任务单元。
 */
class CollectionExporterTask(id: Int, val exportFileAndTime: Boolean = false, exportScore: Boolean = false, exportMeta: Boolean = false) : IllustExporterTask(id, exportScore, exportMeta)

/**
 * image的专项任务单元。
 */
class ImageExporterTask(id: Int, val exportDescription: Boolean = false, exportScore: Boolean = false, exportMeta: Boolean = false) : IllustExporterTask(id, exportScore, exportMeta)

/**
 * album的通用任务单元。
 */
open class AlbumExporterTask(id: Int, val exportMeta: Boolean = false) : MetaExporterTask(id)

class IllustMetaExporterImpl(private val data: DataRepository) : IllustMetaExporter {
    private val taskCount = AtomicInteger(0)
    private val totalTaskCount = AtomicInteger(0)

    private val daemonTask = controlledThread(thread = this::daemonThread)

    override val isIdle: Boolean get() = taskCount.get() <= 0

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            taskCount.set(data.db.sequenceOf(ExporterTasks).count())
            totalTaskCount.set(taskCount.get())
            if(taskCount.get() > 0) {
                daemonTask.start()
            }
        }
    }

    override fun appendNewTask(tasks: Collection<MetaExporterTask>) {
        synchronized(this) {
            val now = DateTime.now()
            data.db.batchInsert(ExporterTasks) {
                for (task in tasks) {
                    val model = task.toModel(now)
                    item {
                        set(it.entityType, model.entityType)
                        set(it.entityId, model.entityId)
                        set(it.exportFileAndTime, model.exportFileAndTime)
                        set(it.exportDescription, model.exportDescription)
                        set(it.exportScore, model.exportScore)
                        set(it.exportMeta, model.exportMeta)
                        set(it.createTime, model.createTime)
                    }
                }
            }
            taskCount.addAndGet(tasks.size)
            totalTaskCount.addAndGet(tasks.size)
            if(taskCount.get() > 0 && !daemonTask.isAlive) {
                daemonTask.start()
            }
        }
    }

    private fun daemonThread() {
        if(taskCount.get() <= 0) {
            totalTaskCount.set(0)
            daemonTask.stop()
            return
        }

        val task = data.db.sequenceOf(ExporterTasks).firstOrNull()
        if(task == null) {
            taskCount.set(0)
            totalTaskCount.set(0)
            daemonTask.stop()
            return
        }
        //休息间隔10ms
        Thread.sleep(10)

        //TODO 实现property exporter后台任务
        data.db.transaction {

        }

        data.db.delete(ExporterTasks) { it.id eq task.id }
        taskCount.decrementAndGet()
    }
}

private fun MetaExporterTask.toModel(now: LocalDateTime = DateTime.now()): ExporterTask {
    return when(this) {
        is CollectionExporterTask -> ExporterTask(0, ExporterTask.EntityType.ILLUST, id, exportFileAndTime, false, exportScore, exportMeta, now)
        is ImageExporterTask -> ExporterTask(0, ExporterTask.EntityType.ILLUST, id, false, exportDescription, exportScore, exportMeta, now)
        is IllustExporterTask -> ExporterTask(0, ExporterTask.EntityType.ILLUST, id, exportFileAndTime = false, exportDescription = false, exportScore, exportMeta, now)
        is AlbumExporterTask -> ExporterTask(0, ExporterTask.EntityType.ALBUM, id, exportFileAndTime = false, exportDescription = false, exportScore = false, exportMeta, now)
        else -> throw UnsupportedOperationException("Unknown exporter task class ${this::class.simpleName}.")
    }
}