package com.heerkirov.hedge.server.components.backend.similar

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.system.FindSimilarResults
import com.heerkirov.hedge.server.dao.system.FindSimilarTasks
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.library.framework.StatefulComponent
import com.heerkirov.hedge.server.library.framework.framework
import com.heerkirov.hedge.server.model.system.FindSimilarResult
import com.heerkirov.hedge.server.model.system.FindSimilarTask
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.toJsonNode
import com.heerkirov.hedge.server.utils.tools.ControlledLoopThread
import com.heerkirov.hedge.server.utils.tools.controlledThread
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.isNotEmpty
import org.ktorm.entity.sequenceOf

/**
 * 处理相似项查找的后台任务。它从task表读取任务，并将确切结果写入result表。
 */
interface SimilarFinder : StatefulComponent {
    fun add(selector: FindSimilarTask.TaskSelector, config: FindSimilarTask.TaskConfig? = null): Int

    fun delete(id: Int)

    fun resolve(id: Int)
}

class SimilarFinderImpl(private val data: DataRepository) : SimilarFinder {
    private val workerThread = SimilarFinderWorkThread(data)

    override val isIdle: Boolean get() = !workerThread.isAlive

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

    override fun resolve(id: Int) {
        TODO("Not yet implemented")
    }
}

class SimilarFinderWorkThread(private val data: DataRepository) : ControlledLoopThread() {
    override fun run() {
        val model = data.db.sequenceOf(FindSimilarTasks).firstOrNull()
        if(model == null) {
            this.stop()
            return
        }

        process(model.selector, model.config ?: data.metadata.findSimilar.defaultTaskConf)

        data.db.delete(FindSimilarTasks) { it.id eq model.id }
    }

    private fun process(selector: FindSimilarTask.TaskSelector, config: FindSimilarTask.TaskConfig) {
        //仅实现了find by source key。其他实现方式，留到以后待确定实现方案后再重构这里
        if(config.findBySourceKey) {
            //实现原理简单，查找是否有source & id & part相同的项即可
            val duplicates = data.db.from(Illusts)
                .select(Illusts.source, Illusts.sourceId, Illusts.sourcePart)
                .where { Illusts.source.isNotNull() and Illusts.sourceId.isNotNull() }
                .groupBy(Illusts.source, Illusts.sourceId, Illusts.sourcePart)
                .having { count(Illusts.id) greater 1 }
                .map { Triple(it[Illusts.source]!!, it[Illusts.sourceId]!!, it[Illusts.sourcePart]) }

            if(duplicates.isNotEmpty()) {
                data.db.transaction {
                    for ((source, sourceId, sourcePart) in duplicates) {
                        val imageIds = data.db.from(Illusts)
                            .select(Illusts.id)
                            .where { (Illusts.source eq source) and (Illusts.sourceId eq sourceId) and if(sourcePart != null) { Illusts.sourcePart eq sourcePart }else{ Illusts.sourcePart.isNull() } }
                            .orderBy(Illusts.id.asc())
                            .map { it[Illusts.id]!! }

                        if(imageIds.isNotEmpty()) {
                            val key = "$source.$sourceId.$sourcePart"

                            val existModel = data.db.from(FindSimilarResults).select(FindSimilarResults.id, FindSimilarResults.imageIds)
                                .where { (FindSimilarResults.type eq FindSimilarResult.Type.DUPLICATED) and (FindSimilarResults.key eq key) }
                                .map { Pair(it[FindSimilarResults.id]!!, it[FindSimilarResults.imageIds]!!) }
                                .firstOrNull()
                            if(existModel != null) {
                                if(existModel.second != imageIds) {
                                    data.db.update(FindSimilarResults) {
                                        where { it.id eq existModel.first }
                                        set(it.imageIds, imageIds)
                                        set(it.ordered, imageIds.last())
                                        set(it.recordTime, DateTime.now())
                                    }
                                }
                            }else{
                                data.db.insert(FindSimilarResults) {
                                    set(it.type, FindSimilarResult.Type.DUPLICATED)
                                    set(it.key, key)
                                    set(it.imageIds, imageIds)
                                    set(it.ordered, imageIds.last())
                                    set(it.recordTime, DateTime.now())
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}