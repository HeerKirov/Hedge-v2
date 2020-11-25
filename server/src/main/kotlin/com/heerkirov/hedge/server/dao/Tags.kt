package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.Tag
import com.heerkirov.hedge.server.model.Topic
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Tags : BaseTable<Tag>("tag", schema = "meta_db") {
    val id = int("id").primaryKey()
    val ordinal = int("ordinal")
    val parentId = int("parent_id")
    val name = varchar("name")
    val otherNames = unionList("other_names")
    val type = enum("type", typeRef<Tag.Type>())
    val isGroup = enum("is_group", typeRef<Tag.IsGroup>())
    val description = varchar("description")
    val links = json("links", typeRef<List<Int>>())
    val examples = json("examples", typeRef<List<Int>>())
    val exportedScore = int("exported_score")
    val cachedCount = int("cached_count")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Tag(
        id = row[id]!!,
        ordinal = row[ordinal]!!,
        parentId = row[parentId],
        name = row[name]!!,
        otherNames = row[otherNames]!!,
        type = row[type]!!,
        isGroup = row[isGroup]!!,
        description = row[description]!!,
        links = row[links],
        examples = row[examples],
        exportedScore = row[exportedScore],
        cachedCount = row[cachedCount]!!,
    )
}