package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.ktorm.composition
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Illusts : BaseTable<Illust>("illust") {
    val id = int("id").primaryKey()
    val type = enum("type", typeRef<Illust.Type>())
    val parentId = int("parent_id")
    val fileId = int("file_id")
    val description = varchar("description")
    val score = int("score")
    val favorite = boolean("favorite")
    val tagme = composition<Illust.Tagme>("tagme")
    val relations = json("relations", typeRef<List<Int>>())
    val exportedDescription = varchar("exported_description")
    val exportedScore = int("exported_score")
    val partitionTime = date("partition_time")
    val orderTime = long("order_time")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean): Illust {
        TODO("Not yet implemented")
    }
}