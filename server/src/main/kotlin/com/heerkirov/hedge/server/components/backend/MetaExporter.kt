package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.framework.StatefulComponent

/**
 * 处理meta元信息重导出的后台任务。适用于处理大批量重新导出的情况。
 * 会将持有的任务持久化到数据库。
 */
interface MetaExporter : StatefulComponent {
    fun appendNewTask(type: MetaExporterTask.Type, id: Int) {
        appendNewTask(listOf(MetaExporterTask(type, id)))
    }

    fun appendNewTask(tasks: Iterable<MetaExporterTask>)
}

/**
 * 一个任务记录单元，标记要执行重导出的对象的种类和id。
 */
data class MetaExporterTask(val type: Type, val id: Int) {
    enum class Type {
        ILLUST,
        ALBUM
    }
}

class MetaExporterImpl(private val data: DataRepository) : MetaExporter {
    override val isIdle: Boolean get() = TODO()

    override fun load() {
        TODO()
    }

    override fun appendNewTask(tasks: Iterable<MetaExporterTask>) {
        //TODO 实现meta exporter后台任务
    }
}