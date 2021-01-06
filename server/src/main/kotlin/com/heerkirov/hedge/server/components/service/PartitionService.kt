package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.collection.Partitions
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.PartitionFilter
import com.heerkirov.hedge.server.form.PartitionRes
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import me.liuwj.ktorm.dsl.*
import java.time.LocalDate

class PartitionService(private val data: DataRepository) {
    fun list(filter: PartitionFilter): ListResult<PartitionRes> {
        return data.db.from(Partitions).select()
            .whereWithConditions {
                if(filter.gte != null) it += Partitions.date greaterEq filter.gte
                if(filter.lt != null) it += Partitions.date less filter.lt
                it += Partitions.cachedCount greater 0
            }
            .limit(filter.offset, filter.limit)
            .orderBy(Partitions.date.asc())
            .toListResult { PartitionRes(it[Partitions.date]!!, it[Partitions.cachedCount]!!) }
    }

    fun get(date: LocalDate): PartitionRes {
        return data.db.from(Partitions).select()
            .where { (Partitions.date eq date) and (Partitions.cachedCount greater 0) }
            .firstOrNull()
            ?.let { PartitionRes(it[Partitions.date]!!, it[Partitions.cachedCount]!!) }
            ?: throw NotFound()
    }
}