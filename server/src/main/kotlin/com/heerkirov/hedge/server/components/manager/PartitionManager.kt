package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.collection.Partitions
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf
import java.time.LocalDate

class PartitionManager(private val data: DataRepository) {
    /**
     * 在这个时间分区下添加了一个新项目。
     */
    fun addItemInPartition(date: LocalDate) {
        val partition = data.db.sequenceOf(Partitions).firstOrNull { it.date eq date }
        if(partition == null) {
            data.db.insert(Partitions) {
                set(it.date, date)
                set(it.cachedCount, 1)
            }
        }else{
            data.db.update(Partitions) {
                where { it.date eq date }
                set(it.cachedCount, it.cachedCount plus 1)
            }
        }
    }

    /**
     * 将一个项目从一个时间分区移动到了另一个时间分区。
     */
    fun updateItemPartition(fromDate: LocalDate, toDate: LocalDate) {
        if(fromDate != toDate) {
            data.db.update(Partitions) {
                where { it.date eq fromDate }
                set(it.cachedCount, it.cachedCount minus 1)
            }

            addItemInPartition(toDate)
        }
    }
}