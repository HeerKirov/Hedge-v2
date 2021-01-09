package com.heerkirov.hedge.server.dao.types

import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column

/**
 * 标签表。
 */
abstract class MetaTag<T : Any>(tableName: String, schema: String? = null) : BaseTable<T>(tableName = tableName, schema = schema) {
    abstract fun metaId(): Column<Int>
    abstract fun cachedCount(): Column<Int>
}