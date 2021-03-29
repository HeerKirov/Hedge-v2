package com.heerkirov.hedge.server.dao.types

import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import java.time.LocalDateTime

/**
 * 标签表。
 */
abstract class MetaTag<T : Any>(tableName: String, schema: String? = null) : BaseTable<T>(tableName = tableName, schema = schema) {
    abstract val id: Column<Int>
    abstract val name: Column<String>
    abstract val otherNames: Column<List<String>>
    abstract val cachedCount: Column<Int>
    abstract val updateTime: Column<LocalDateTime>
}