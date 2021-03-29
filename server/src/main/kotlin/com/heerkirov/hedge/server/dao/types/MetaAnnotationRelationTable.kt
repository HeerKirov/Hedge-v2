package com.heerkirov.hedge.server.dao.types

import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column

/**
 * 标签和注解类型的关系表的抽象表。
 */
abstract class MetaAnnotationRelationTable<T : Any>(tableName: String, schema: String? = null) : BaseTable<T>(tableName = tableName, schema = schema) {
    abstract fun metaId(): Column<Int>
    abstract fun annotationId(): Column<Int>
}