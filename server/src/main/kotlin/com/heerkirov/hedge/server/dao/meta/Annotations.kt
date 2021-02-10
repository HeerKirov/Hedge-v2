package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.ktorm.composition
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Annotations : BaseTable<Annotation>("annotation", schema = "meta_db") {
    val id = int("id").primaryKey()
    val name = varchar("name")
    val canBeExported = boolean("can_be_exported")
    val target = composition<Annotation.AnnotationTarget>("target")
    val createTime = datetime("create_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Annotation(
        id = row[id]!!,
        name = row[name]!!,
        canBeExported = row[canBeExported]!!,
        target = row[target]!!,
        createTime = row[createTime]!!
    )
}