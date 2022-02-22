package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.source.SourcePools
import com.heerkirov.hedge.server.dto.SourcePoolForm
import com.heerkirov.hedge.server.model.source.SourcePool
import org.ktorm.dsl.*
import org.ktorm.entity.*

class SourcePoolManager(private val data: DataRepository) {
    fun getOrCreateSourcePool(source: String, poolKey: String, poolTitle: String?): SourcePool {
        return data.db.sequenceOf(SourcePools)
            .firstOrNull { it.source eq source and (it.key eq poolKey) }
            ?: run {
                val id = data.db.insertAndGenerateKey(SourcePools) {
                    set(it.source, source)
                    set(it.key, poolKey)
                    set(it.title, poolTitle ?: "")
                } as Int
                SourcePool(id, source, poolKey, poolTitle ?: "")
            }
    }

    /**
     * 在image的source update方法中，根据给出的pools dto，创建或修改数据库里的source pool model，并返回这些model的id。
     * 这个方法的逻辑是，source pools总是基于其key做唯一定位，当key不变时，修改其他属性视为更新，而改变key即认为是不同的对象。
     * 不会检验source的合法性，因为假设之前已经手动校验过了。
     */
    fun getAndUpsertSourcePools(source: String, pools: List<SourcePoolForm>): List<Int> {
        val poolMap = pools.associateBy { it.key }

        val dbPools = data.db.sequenceOf(SourcePools).filter { it.source eq source and (it.key inList poolMap.keys) }.toList()
        val dbPoolMap = dbPools.associateBy { it.key }

        val minus = poolMap.keys - dbPoolMap.keys
        if(minus.isNotEmpty()) {
            data.db.batchInsert(SourcePools) {
                for (key in minus) {
                    val pool = poolMap[key]!!
                    item {
                        set(it.source, source)
                        set(it.key, key)
                        set(it.title, pool.title.unwrapOr { "" })
                    }
                }
            }
        }

        val common = poolMap.keys.intersect(dbPoolMap.keys).filter { key ->
            val form = poolMap[key]!!
            form.title.letOpt { it != dbPoolMap[key]!!.title }.unwrapOr { false }
        }
        if(common.isNotEmpty()) {
            data.db.batchUpdate(SourcePools) {
                for (key in common) {
                    val pool = poolMap[key]!!
                    val dbPool = dbPoolMap[key]!!
                    item {
                        where { it.id eq dbPool.id }
                        pool.title.applyOpt { set(it.title, this) }
                    }
                }
            }
        }

        return data.db.from(SourcePools).select(SourcePools.id)
            .where { SourcePools.source eq source and (SourcePools.key inList poolMap.keys) }
            .map { it[SourcePools.id]!! }
    }
}