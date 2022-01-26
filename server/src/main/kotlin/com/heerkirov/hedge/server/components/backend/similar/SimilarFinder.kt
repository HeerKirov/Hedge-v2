package com.heerkirov.hedge.server.components.backend.similar

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.system.FindSimilarTasks
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.library.framework.framework
import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.tools.ControlledLoopThread
import com.heerkirov.hedge.server.utils.tools.controlledThread
import org.ktorm.dsl.delete
import org.ktorm.dsl.eq
import org.ktorm.dsl.insertAndGenerateKey
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.isNotEmpty
import org.ktorm.entity.sequenceOf

/**
 * 处理相似项查找的后台任务。它从task表读取任务，并将确切结果写入result表。
 */
interface SimilarFinder : StatefulComponent {
    fun add(selector: FindSimilarTask.TaskSelector, config: FindSimilarTask.TaskConfig? = null): Int

    fun delete(id: Int)
}

class SimilarFinderImpl(private val data: DataRepository) : SimilarFinder {
    private val workerThread = SimilarFinderWorkThread(data)

    override val isIdle: Boolean = true

    override fun load() {
        if(data.status == LoadStatus.LOADED) {
            if(data.db.sequenceOf(FindSimilarTasks).isNotEmpty()) {
                workerThread.start()
            }
        }
    }

    override fun add(selector: FindSimilarTask.TaskSelector, config: FindSimilarTask.TaskConfig?): Int {
        val id = data.db.insertAndGenerateKey(FindSimilarTasks) {
            set(it.selector, selector)
            set(it.config, config)
            set(it.recordTime, DateTime.now())
        } as Int

        workerThread.start()

        return id
    }

    override fun delete(id: Int) {
        if(data.db.delete(FindSimilarTasks) { it.id eq id } <= 0) {
            throw be(NotFound())
        }
    }
}

class SimilarFinderWorkThread(private val data: DataRepository) : ControlledLoopThread() {
    override fun run() {
        val model = data.db.sequenceOf(FindSimilarTasks).firstOrNull()
        if(model == null) {
            this.stop()
            return
        }

        data.db.delete(FindSimilarTasks) { it.id eq model.id }
    }
}