package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.dao.types.EntityTargetRelationTable
import com.heerkirov.hedge.server.model.IllustTopicRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.boolean
import me.liuwj.ktorm.schema.int

object IllustTopicRelations : EntityTargetRelationTable<IllustTopicRelation>("illust_topic_relation") {
    val illustId = int("illust_id")
    val topicId = int("topic_id")
    val isExported = boolean("is_exported")

    override fun entityId(): Column<Int> = illustId
    override fun targetId(): Column<Int> = topicId
    override fun exported(): Column<Boolean> = isExported

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = IllustTopicRelation(
        illustId = row[illustId]!!,
        topicId = row[topicId]!!,
        isExported = row[isExported]!!
    )
}
