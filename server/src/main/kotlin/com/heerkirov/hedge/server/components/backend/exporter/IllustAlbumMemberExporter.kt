package com.heerkirov.hedge.server.components.backend.exporter

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.IllustKit
import kotlin.reflect.KClass

data class IllustAlbumMemberExporterTask(val imageIds: List<Int>) : ExporterTask

class IllustAlbumMemberExporter(private val data: DataRepository, private val illustKit: IllustKit) : ExporterWorker<IllustAlbumMemberExporterTask>, MergedProcessWorker<IllustAlbumMemberExporterTask>, LatencyProcessWorker {
    override val clazz: KClass<IllustAlbumMemberExporterTask> = IllustAlbumMemberExporterTask::class

    override val latency: Long = 1000L * 5

    override fun keyof(task: IllustAlbumMemberExporterTask): String = "any"

    override fun merge(tasks: List<IllustAlbumMemberExporterTask>): IllustAlbumMemberExporterTask {
        return IllustAlbumMemberExporterTask(tasks.asSequence().flatMap { it.imageIds.asSequence() }.distinct().toList())
    }

    override fun run(task: IllustAlbumMemberExporterTask) {
        data.db.transaction {
            illustKit.exportAlbumFlag(task.imageIds)
        }
    }
}