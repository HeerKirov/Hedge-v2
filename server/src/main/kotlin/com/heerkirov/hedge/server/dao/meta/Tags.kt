package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*
import java.time.LocalDateTime

object Tags : MetaTag<Tag>("tag", schema = "meta_db") {
    override val id = int("id").primaryKey()
    val ordinal = int("ordinal")
    val parentId = int("parent_id")
    override val name = varchar("name")
    override val otherNames = unionList("other_names")
    val type = enum("type", typeRef<Tag.Type>())
    val isGroup = enum("is_group", typeRef<Tag.IsGroup>())
    val description = varchar("description")
    val color = varchar("color")
    val links = json("links", typeRef<List<Int>>())
    val examples = json("examples", typeRef<List<Int>>())
    val exportedScore = int("exported_score")
    override val cachedCount = int("cached_count")
    val createTime = datetime("create_time")
    override val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Tag(
        id = row[id]!!,
        ordinal = row[ordinal]!!,
        parentId = row[parentId],
        name = row[name]!!,
        otherNames = row[otherNames]!!,
        type = row[type]!!,
        isGroup = row[isGroup]!!,
        description = row[description]!!,
        color = row[color],
        links = row[links],
        examples = row[examples],
        exportedScore = row[exportedScore],
        cachedCount = row[cachedCount]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}