package com.heerkirov.hedge.server.dao.system

import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object FindSimilarTasks : BaseTable<FindSimilarTask>("find_similar_task", schema = "system_db") {
    val id = int("id").primaryKey()
    val selector = json("selector", typeRef<FindSimilarTask.TaskSelector>())
    val config = json("config", typeRef<FindSimilarTask.TaskConfig>())
    val recordTime = datetime("record_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = FindSimilarTask(
        id = row[id]!!,
        selector = row[selector]!!,
        config = row[config],
        recordTime = row[recordTime]!!
    )
}