package com.heerkirov.hedge.server.components.backend

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.saveStorage
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.enums.LoadStatus
import com.heerkirov.hedge.server.library.framework.Component
import com.heerkirov.hedge.server.utils.controlledThread
import org.ktorm.dsl.BatchUpdateStatementBuilder
import org.ktorm.dsl.batchUpdate
import org.ktorm.dsl.eq
import org.ktorm.entity.sequenceOf

interface TagExporter : Component {
    /**
     * 通知exporter稍后对tag的global ordinal进行刷新。
     */
    fun refreshGlobalOrdinal()
}

class TagExporterImpl(private val data: DataRepository) : TagExporter {
    private val daemonTask = controlledThread(thread = ::daemonThread)

    private var refreshGlobalOrdinal: Boolean = false

    override fun load() {
        if(data.status == LoadStatus.LOADED && data.storage.tagExporter.refreshGlobalOrdinal) {
            refreshGlobalOrdinal = true
            daemonTask.start()
        }
    }

    override fun refreshGlobalOrdinal() {
        if(!refreshGlobalOrdinal) {
            refreshGlobalOrdinal = true
            data.saveStorage {
                tagExporter.refreshGlobalOrdinal = true
            }
            if(daemonTask.isAlive) {
                daemonTask.stop(force = true)
            }
            daemonTask.start()
        }
    }

    private fun daemonThread() {
        try {
            Thread.sleep(1000L * 10)
        }catch (e: InterruptedException) {
            //等待已被中断
            return
        }

        executeRefresh()

        refreshGlobalOrdinal = false
        data.saveStorage {
            tagExporter.refreshGlobalOrdinal = false
        }
        daemonTask.stop()
    }

    private fun executeRefresh() {
        val records = data.db.sequenceOf(Tags).asKotlinSequence().groupBy { it.parentId }

        var nextOrdinal = 0

        fun BatchUpdateStatementBuilder<Tags>.traverse(parentId: Int?) {
            val tags = records[parentId]?.sortedBy { it.ordinal }
            if(!tags.isNullOrEmpty()) {
                for(tag in tags) {
                    val globalOrdinal = nextOrdinal++
                    if(tag.globalOrdinal != globalOrdinal) {
                        item {
                            where { it.id eq tag.id }
                            set(it.globalOrdinal, globalOrdinal)
                        }
                    }
                    traverse(tag.id)
                }
            }
        }

        data.db.transaction {
            data.db.batchUpdate(Tags) {
                traverse(null)
            }
        }
    }
}