package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.model.system.ExporterTask
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object ExporterTasks : BaseTable<ExporterTask>("exporter_task", schema = "system_db") {
    val id = int("id").primaryKey()
    val entityType = enum("entity_type", typeRef<ExporterTask.EntityType>())
    val entityId = int("entity_id")
    val exportFirstCover = boolean("export_first_cover")
    val exportDescription = boolean("export_description")
    val exportScore = boolean("export_score")
    val exportMeta = boolean("export_meta")
    val createTime = datetime("create_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = ExporterTask(
        id = row[id]!!,
        entityType = row[entityType]!!,
        entityId = row[entityId]!!,
        exportFirstCover = row[exportFirstCover]!!,
        exportDescription = row[exportDescription]!!,
        exportScore = row[exportScore]!!,
        exportMeta = row[exportMeta]!!,
        createTime = row[createTime]!!
    )
}