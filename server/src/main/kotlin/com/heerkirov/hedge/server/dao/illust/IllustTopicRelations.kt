package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.dao.types.EntityMetaRelationTable
import com.heerkirov.hedge.server.model.illust.IllustTopicRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.boolean
import org.ktorm.schema.int

open class IllustTopicRelations(alias: String?) : EntityMetaRelationTable<IllustTopicRelation>("illust_topic_relation", alias = alias) {
    companion object : IllustTopicRelations(null)
    override fun aliased(alias: String) = IllustTopicRelations(alias)

    val illustId = int("illust_id")
    val topicId = int("topic_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = illustId
    override fun metaId(): Column<Int> = topicId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustTopicRelation(
        illustId = row[illustId]!!,
        topicId = row[topicId]!!,
        isExported = row[isExported]!!
    )
}
