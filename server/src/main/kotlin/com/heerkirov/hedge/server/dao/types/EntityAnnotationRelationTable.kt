package com.heerkirov.hedge.server.dao.types

import com.heerkirov.hedge.server.model.meta.Annotation
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column

/**
 * 实体和注解类型的关系表的抽象表。
 */
abstract class EntityAnnotationRelationTable<T : Any>(tableName: String, schema: String? = null, alias: String? = null) : BaseTable<T>(tableName = tableName, schema = schema, alias = alias) {
    abstract fun entityId(): Column<Int>
    abstract fun annotationId(): Column<Int>
    abstract fun exported(): Column<Annotation.ExportedFrom>
}