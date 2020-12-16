package com.heerkirov.hedge.server.dao.types

import com.heerkirov.hedge.server.model.Annotation
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column

/**
 * 标签和注解类型的关系表的抽象表。
 */
abstract class TargetAnnotationRelationTable<T : Any>(tableName: String, schema: String? = null) : BaseTable<T>(tableName = tableName, schema = schema) {
    abstract fun targetId(): Column<Int>
    abstract fun annotationId(): Column<Int>
}