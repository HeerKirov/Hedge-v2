package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int
import me.liuwj.ktorm.schema.varchar

object Annotations : BaseTable<Annotation>("annotation", schema = "meta_db") {
    val id = int("id").primaryKey()
    val name = varchar("name")
    val canBeExported = boolean("can_be_exported")
    val target = composition<Annotation.AnnotationTarget>("target")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Annotation(
        id = row[id]!!,
        name = row[name]!!,
        canBeExported = row[canBeExported]!!,
        target = row[target]
    )
}