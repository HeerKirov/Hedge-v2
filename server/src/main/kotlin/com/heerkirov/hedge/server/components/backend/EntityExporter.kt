package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.components.kit.IllustKit
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.system.ExporterRecords
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.system.ExporterRecord
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.tools.controlledThread
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.types.undefined
import org.ktorm.dsl.*
import org.ktorm.entity.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.roundToInt

/**
 * 处理元信息重导出的后台任务。适用于处理大批量重新导出的情况。
 * 会将持有的任务持久化到数据库。
 */
interface EntityExporter : StatefulComponent {
    /**
     * 添加一个新的任务。
     * - 更新collection的score/meta导出属性。可细化到哪几项。
     *      - 由于子项变动——发生在collection子项编辑。
     *      - 或由于子项修改——发生在image编辑联动影响parent。
     * - 更新collection的file相关/score/meta。由于子项变动——创建image并指定parent。
     */
    fun appendNewTask(task: EntityExporterTask) {
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
    fun appendNewTask(tasks: Collection<EntityExporterTask>)
}

/**
 * 一个任务记录单元，标记要执行重导出的对象的种类和id。
 */
abstract class EntityExporterTask(val id: Int)

/**
 * illust的通用任务单元。
 */
open class IllustExporterTask(id: Int, val exportScore: Boolean = false, val exportMeta: Boolean = false, val exportDescription: Boolean, val exportFirstCover: Boolean) : EntityExporterTask(id)

/**
 * collection的专项任务单元。
 */
class CollectionExporterTask(id: Int, exportScore: Boolean = false, exportMeta: Boolean = false, exportFirstCover: Boolean = false) : IllustExporterTask(id, exportScore, exportMeta, false, exportFirstCover)

/**
 * image的专项任务单元。
 */
class ImageExporterTask(id: Int, exportDescription: Boolean = false, exportScore: Boolean = false, exportMeta: Boolean = false) : IllustExporterTask(id, exportScore, exportMeta, exportDescription, false)

/**
 * album的通用任务单元。
 */
open class AlbumExporterTask(id: Int, val exportMeta: Boolean = false) : EntityExporterTask(id)

class EntityExporterImpl(private val data: DataRepository,
                         private val illustKit: IllustKit,
                         private val albumKit: AlbumKit) : EntityExporter {
    private val taskCount = AtomicInteger(0)
    private val totalTaskCount = AtomicInteger(0)

    private val daemonTask = controlledThread(thread = ::daemonThread)

    override val isIdle: Boolean get() = taskCount.get() <= 0

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            //组件加载时，从db加载剩余数量，若存在剩余数量就直接开始daemon task。
            taskCount.set(data.db.sequenceOf(ExporterRecords).count())
            totalTaskCount.set(taskCount.get())
            if(taskCount.get() > 0) {
                daemonTask.start()
            }
        }
    }

    override fun appendNewTask(tasks: Collection<EntityExporterTask>) {
        synchronized(this) {
            val now = DateTime.now()
            data.db.batchInsert(ExporterRecords) {
                for (task in tasks) {
                    val model = task.toModel(now)
                    item {
                        set(it.type, model.type)
                        set(it.entityId, model.entityId)
                        set(it.exportFirstCover, model.exportFirstCover)
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
        //执行背景任务的线程函数。此函数单线程执行，不断地从db查询下一条task并执行。两次执行之间有一点微小的间隔。
        if(taskCount.get() <= 0) {
            synchronized(this) {
                if(taskCount.get() <= 0) {
                    totalTaskCount.set(0)
                    daemonTask.stop()
                    return
                }
            }
        }

        val model = data.db.sequenceOf(ExporterRecords).firstOrNull()
        if(model == null) {
            taskCount.set(0)
            totalTaskCount.set(0)
            daemonTask.stop()
            return
        }
        //休息间隔10ms
        Thread.sleep(10)

        when(val task = model.toTask()) {
            is AlbumExporterTask -> exportAlbum(task)
            is IllustExporterTask -> exportIllust(task)
            else -> throw UnsupportedOperationException("Unsupported task type ${task::class.simpleName}.")
        }

        data.db.delete(ExporterRecords) { it.id eq model.id }
        taskCount.decrementAndGet()
    }

    private fun exportAlbum(task: AlbumExporterTask) {
        data.db.transaction {
            if(task.exportMeta) {
                data.db.sequenceOf(Albums).firstOrNull { it.id eq task.id } ?: return

                albumKit.refreshAllMeta(task.id)
            }
        }
    }

    private fun exportIllust(task: IllustExporterTask) {
        data.db.transaction {
            val illust = data.db.sequenceOf(Illusts).firstOrNull { it.id eq task.id } ?: return
            val exportedScore: Opt<Int?>
            val exportedDescription: Opt<String>
            val exportedFileAndTime: Opt<Triple<Int, LocalDate, Long>>
            val cachedChildrenCount: Opt<Int>
            if(illust.type == Illust.Type.COLLECTION) {
                //collection不需要重导出description，因为它的值总是取自originDescription，在编写时赋值，不会有别的东西影响它的
                exportedDescription = undefined()

                //实际上collection还得重新导出file、orderTime和childrenCount
                exportedFileAndTime = if(task.exportFirstCover) {
                    val firstChild = data.db.from(Illusts).select()
                        .where { Illusts.parentId eq task.id }
                        .orderBy(Illusts.orderTime.asc())
                        .limit(0, 1)
                        .firstOrNull()
                        ?.let { Illusts.createEntity(it) }
                    if(firstChild != null) {
                        Opt(Triple(firstChild.fileId, firstChild.partitionTime, firstChild.orderTime))
                    }else undefined()
                }else undefined()
                cachedChildrenCount = if(task.exportFirstCover) {
                    Opt(data.db.sequenceOf(Illusts).filter { Illusts.parentId eq task.id }.count())
                }else undefined()

                //exportedScore取score，或者缺省时，取出avg(children.score)
                exportedScore = if(task.exportScore) {
                    Opt(illust.score ?: data.db.from(Illusts)
                        .select(count(Illusts.id).aliased("count"), avg(Illusts.score).aliased("score"))
                        .where { (Illusts.parentId eq task.id) and (Illusts.score.isNotNull()) }
                        .firstOrNull()?.run {
                            if(getInt("count") > 0) getDouble("score").roundToInt() else null
                        })

                }else undefined()

                //exportedMeta通过推导生成，或者缺省时，从children取notExportedMeta的并集推导生成
                if(task.exportMeta) {
                    illustKit.refreshAllMeta(task.id, copyFromChildren = true)
                }
            }else{
                val parent by lazy { if(illust.parentId == null) null else data.db.sequenceOf(Illusts).firstOrNull { it.id eq illust.parentId} }

                exportedFileAndTime = undefined()
                cachedChildrenCount = undefined()

                //exportedDescription取description，或者缺省时，i沿用parent的description
                exportedDescription = if(task.exportDescription) {
                    Opt(illust.description.ifEmpty { parent?.description ?: "" })
                }else undefined()

                //exportedScore取score，或者缺省时，沿用parent的exportedScore
                exportedScore = if(task.exportScore) {
                    Opt(illust.score ?: parent?.score)
                }else undefined()

                //exportedMeta通过推导生成，或者缺省时，直接从parent拷贝全部MetaTag
                if(task.exportMeta) {
                    illustKit.refreshAllMeta(task.id, copyFromParent = illust.parentId)
                }
            }

            if(anyOpt(exportedDescription, exportedScore, exportedFileAndTime, cachedChildrenCount)) {
                data.db.update(Illusts) {
                    where { it.id eq task.id }
                    exportedDescription.applyOpt { set(it.exportedDescription, this) }
                    exportedScore.applyOpt { set(it.exportedScore, this) }
                    exportedFileAndTime.alsoOpt { (fileId, partitionTime, orderTime) ->
                        set(it.fileId, fileId)
                        set(it.partitionTime, partitionTime)
                        set(it.orderTime, orderTime)
                    }
                    cachedChildrenCount.applyOpt { set(it.cachedChildrenCount, this) }
                }
            }
        }
    }
}

private fun EntityExporterTask.toModel(now: LocalDateTime = DateTime.now()): ExporterRecord {
    return when(this) {
        is IllustExporterTask -> ExporterRecord(0, ExporterRecord.Type.ILLUST, id, exportFirstCover, exportDescription, exportScore, exportMeta, now)
        is AlbumExporterTask -> ExporterRecord(0, ExporterRecord.Type.ALBUM, id, exportFirstCover = false, exportDescription = false, exportScore = false, exportMeta, now)
        else -> throw UnsupportedOperationException("Unknown exporter task class ${this::class.simpleName}.")
    }
}

private fun ExporterRecord.toTask(): EntityExporterTask {
    return if(this.type == ExporterRecord.Type.ALBUM) {
        AlbumExporterTask(this.entityId, exportMeta)
    }else{
        IllustExporterTask(this.entityId, exportScore, exportMeta, exportDescription, exportFirstCover)
    }
}