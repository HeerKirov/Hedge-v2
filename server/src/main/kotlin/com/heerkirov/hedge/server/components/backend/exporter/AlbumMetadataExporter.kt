package com.heerkirov.hedge.server.components.backend.exporter

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.toJSONString
import org.ktorm.dsl.eq
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import kotlin.reflect.KClass

data class AlbumMetadataExporterTask(val id: Int, val exportMetaTag: Boolean = false) : ExporterTask

class AlbumMetadataExporter(private val data: DataRepository,
                            private val albumKit: AlbumKit) : ExporterWorker<AlbumMetadataExporterTask>, MergedProcessWorker<AlbumMetadataExporterTask> {
    override val clazz: KClass<AlbumMetadataExporterTask> = AlbumMetadataExporterTask::class

    override fun keyof(task: AlbumMetadataExporterTask): String = task.id.toString()

    override fun merge(tasks: List<AlbumMetadataExporterTask>): AlbumMetadataExporterTask {
        return AlbumMetadataExporterTask(tasks.first().id, exportMetaTag = tasks.any { it.exportMetaTag })
    }

    override fun run(task: AlbumMetadataExporterTask) {
        data.db.transaction {
            if(task.exportMetaTag) {
                data.db.sequenceOf(Albums).firstOrNull { it.id eq task.id } ?: return

                albumKit.refreshAllMeta(task.id)
            }
        }
    }
}