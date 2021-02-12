package com.heerkirov.hedge.server.dao.types

import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column

/**
 * 实体和标签关系表的抽象表。
 */
abstract class EntityMetaRelationTable<T : Any>(tableName: String, schema: String? = null, alias: String? = null) : BaseTable<T>(tableName = tableName, schema = schema, alias = alias) {
    abstract fun entityId(): Column<Int>
    abstract fun metaId(): Column<Int>
    abstract fun exported(): Column<Boolean>
}