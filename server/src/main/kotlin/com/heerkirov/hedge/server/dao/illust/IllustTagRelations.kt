package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.model.illust.IllustTagRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.boolean
import org.ktorm.schema.int

open class IllustTagRelations(alias: String?) : EntityMetaRelationTable<IllustTagRelation>("illust_tag_relation", alias = alias) {
    companion object : IllustTagRelations(null)
    override fun aliased(alias: String) = IllustTagRelations(alias)

    val illustId = int("illust_id")
    val tagId = int("tag_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = illustId
    override fun metaId(): Column<Int> = tagId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustTagRelation(
        illustId = row[illustId]!!,
        tagId = row[tagId]!!,
        isExported = row[isExported]!!
    )
}
