package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.similar.SimilarFinder
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.system.FindSimilarResults
import com.heerkirov.hedge.server.dao.system.FindSimilarTasks
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.descendingOrderItem
import com.heerkirov.hedge.server.utils.types.toListResult
import org.ktorm.dsl.eq
import org.ktorm.dsl.from
import org.ktorm.dsl.limit
import org.ktorm.dsl.select
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class FindSimilarService(private val data: DataRepository, private val finder: SimilarFinder) {
    private val taskOrderTranslator = OrderTranslator {
        "id" to FindSimilarTasks.id
        "recordTime" to FindSimilarTasks.recordTime
    }

    private val resultOrderTranslator = OrderTranslator {
        "id" to FindSimilarResults.id
        "orderedId" to FindSimilarResults.ordered
        "recordTime" to FindSimilarResults.recordTime
    }

    fun listTask(filter: FindSimilarTaskQueryFilter): ListResult<FindSimilarTaskRes> {
        return data.db.from(FindSimilarTasks)
            .select()
            .limit(filter.offset, filter.limit)
            .orderBy(taskOrderTranslator, filter.order, default = descendingOrderItem("recordTime"))
            .toListResult { newFindSimilarTaskRes(FindSimilarTasks.createEntity(it)) }
    }

    fun createTask(form: FindSimilarTaskCreateForm): Int {
        data.db.transaction {
            return finder.add(form.selector, form.config)
        }
    }

    /**
     * @throws NotFound
     */
    fun getTask(id: Int): FindSimilarTaskRes {
        val task = data.db.sequenceOf(FindSimilarTasks).firstOrNull { it.id eq id } ?: throw be(NotFound())
        return newFindSimilarTaskRes(task)
    }

    /**
     * @throws NotFound
     */
    fun deleteTask(id: Int) {
        data.db.transaction {
            finder.delete(id)
        }
    }

    fun listResult(filter: FindSimilarResultQueryFilter): ListResult<FindSimilarResultRes> {
        return data.db.from(FindSimilarResults)
            .select()
            .limit(filter.offset, filter.limit)
            .orderBy(resultOrderTranslator, filter.order, default = descendingOrderItem("orderedId"))
            .toListResult { newFindSimilarResultRes(FindSimilarResults.createEntity(it)) }
    }

    /**
     * @throws NotFound
     */
    fun getResult(id: Int): FindSimilarResultRes {
        val result = data.db.sequenceOf(FindSimilarResults).firstOrNull { it.id eq id } ?: throw be(NotFound())
        return newFindSimilarResultRes(result)
    }

    /**
     * @throws NotFound
     */
    fun processResult(id: Int) {
        TODO()
    }

    /**
     * @throws ResourceNotExist
     */
    fun batchProcessResult() {

    }
}