package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.collection.Partitions
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.dto.PartitionFilter
import com.heerkirov.hedge.server.dto.PartitionMonthRes
import com.heerkirov.hedge.server.dto.PartitionRes
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import org.ktorm.dsl.*
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.sortedBy
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

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(date: LocalDate): PartitionRes {
        return data.db.from(Partitions).select()
            .where { (Partitions.date eq date) and (Partitions.cachedCount greater 0) }
            .firstOrNull()
            ?.let { PartitionRes(it[Partitions.date]!!, it[Partitions.cachedCount]!!) }
            ?: throw be(NotFound())
    }

    fun listMonths(): List<PartitionMonthRes> {
        return data.db.sequenceOf(Partitions)
            .sortedBy { it.date }
            .asKotlinSequence()
            .groupBy { it.date.year to it.date.monthValue }
            .map { (e, p) -> PartitionMonthRes(e.first, e.second, p.count(), p.sumOf { it.cachedCount }) }
    }
}