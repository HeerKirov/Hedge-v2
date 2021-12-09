package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.system.MeHistoryMetas
import com.heerkirov.hedge.server.dto.MetaUtilIdentity
import com.heerkirov.hedge.server.enums.IdentityType
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.model.system.MeHistoryMeta
import com.heerkirov.hedge.server.utils.types.CountSet
import org.ktorm.dsl.*
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList
import java.util.*

class MetaHistoryManager(private val data: DataRepository) {
    private val identityMaxStorageCount = 10
    private val identityHistory: LinkedList<MetaUtilIdentity> = LinkedList()

    private val metaMaxStorageCount = 100
    private val metaRecentTagCount = 20
    private val metaRecentCount = 10
    private val metaHistory: MutableMap<MetaType, MutableList<MeHistoryMeta>> = mutableMapOf()
    private val metaFrequent: MutableMap<MetaType, CountSet<Int>> = mutableMapOf()
    private val metaSequenceIds: MutableMap<MetaType, Long> = mutableMapOf()
    private var metaLoaded: Boolean = false

    fun getIdentities(): List<MetaUtilIdentity> {
        return identityHistory
    }

    @Synchronized
    fun addIdentity(type: IdentityType, id: Int) {
        val model = MetaUtilIdentity(type, id)
        //首先尝试移除可能已存在的model，防止重复
        identityHistory.remove(model)
        //然后再次添加到队首
        identityHistory.addFirst(model)
        if(identityHistory.size > identityMaxStorageCount) {
            identityHistory.removeLast()
        }
    }

    fun getMetasByRecent(): Map<MetaType, List<Int>> {
        checkAndLoadMetaHistoryFromDB()

        return metaHistory.mapValues { (type, list) ->
            val requiredCount = if(type === MetaType.TAG) metaRecentTagCount else metaRecentCount
            list.reversed()
                .distinctBy { it.metaId }
                .let { if(it.size > requiredCount) it.subList(0, requiredCount) else it }
                .map { it.metaId }
        }
    }

    fun getMetasByFrequent(): Map<MetaType, List<Int>> {
        checkAndLoadMetaHistoryFromDB()

        return metaFrequent.mapValues { (type, set) ->
            val requiredCount = if(type === MetaType.TAG) metaRecentTagCount else metaRecentCount
            set.theMost(requiredCount).map { (id, _) -> id }
        }
    }

    @Synchronized
    fun addMeta(type: MetaType, id: Int) {
        checkAndLoadMetaHistoryFromDB()

        val sequenceId = metaSequenceIds[type]!! + 1

        val model = MeHistoryMeta(sequenceId, type, id, System.currentTimeMillis())

        data.db.insert(MeHistoryMetas) {
            set(it.sequenceId, model.sequenceId)
            set(it.metaType, model.metaType)
            set(it.metaId, model.metaId)
            set(it.recordTime, model.recordTime)
        }

        val frequent = metaFrequent[type]!!
        val history = metaHistory[type]!!
        frequent.add(model.metaId)
        history.add(model)
        metaSequenceIds[type] = sequenceId

        if(history.size > metaMaxStorageCount) {
            val removedModel = history.removeAt(0)
            frequent.remove(removedModel.metaId)

            data.db.delete(MeHistoryMetas) {
                (it.sequenceId eq removedModel.sequenceId) and (it.metaType eq type)
            }
        }
    }

    @Synchronized
    fun clearMeta() {
        metaHistory.putAll(mapOf(MetaType.TOPIC to LinkedList(), MetaType.AUTHOR to LinkedList(), MetaType.TAG to LinkedList()))
        metaFrequent.putAll(mapOf(MetaType.TOPIC to CountSet(), MetaType.AUTHOR to CountSet(), MetaType.TAG to CountSet()))
        metaSequenceIds.putAll(mapOf(MetaType.TOPIC to 0, MetaType.AUTHOR to 0, MetaType.TAG to 0))

        data.db.deleteAll(MeHistoryMetas)
    }

    @Synchronized
    private fun checkAndLoadMetaHistoryFromDB() {
        if(!metaLoaded) {
            metaHistory.putAll(mapOf(MetaType.TOPIC to LinkedList(), MetaType.AUTHOR to LinkedList(), MetaType.TAG to LinkedList()))
            metaFrequent.putAll(mapOf(MetaType.TOPIC to CountSet(), MetaType.AUTHOR to CountSet(), MetaType.TAG to CountSet()))
            metaSequenceIds.putAll(mapOf(MetaType.TOPIC to 0, MetaType.AUTHOR to 0, MetaType.TAG to 0))

            val dbResult = data.db.sequenceOf(MeHistoryMetas).toList()
            if(dbResult.isNotEmpty()) {
                //将db记录全部加入history
                for(meHistoryMeta in dbResult) {
                    metaHistory[meHistoryMeta.metaType]!!.add(meHistoryMeta)
                }
                //将db记录全部加入frequent统计
                for ((t, l) in metaHistory) {
                    val eachCount = l.groupingBy { it.metaId }.eachCount()
                    for ((id, count) in eachCount) {
                        metaFrequent[t]!!.add(id, count)
                    }
                }
                //从db记录统计max sequenceId
                metaSequenceIds.putAll(metaHistory.mapValues { (_, l) -> l.maxOfOrNull { it.sequenceId } ?: 0 })
            }

            metaLoaded = true
        }
    }
}