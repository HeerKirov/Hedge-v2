package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.EntityTargetRelationTable
import com.heerkirov.hedge.server.model.IllustAuthorRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

object IllustAuthorRelations : EntityTargetRelationTable<IllustAuthorRelation>("illust_author_relation") {
    val illustId = int("illust_id")
    val authorId = int("author_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = illustId
    override fun targetId(): Column<Int> = authorId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustAuthorRelation(
        illustId = row[illustId]!!,
        authorId = row[authorId]!!,
        isExported = row[isExported]!!
    )
}
