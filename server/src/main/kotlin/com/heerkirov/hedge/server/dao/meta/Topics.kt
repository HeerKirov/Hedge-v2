package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object Topics : BaseTable<Topic>("topic", schema = "meta_db") {
    val id = int("id").primaryKey()
    val name = varchar("name")
    val otherNames = unionList("other_names")
    val parentId = int("parent_id")
    val type = enum("type", typeRef<Topic.Type>())
    val score = int("score")
    val favorite = boolean("favorite")
    val links = json("links", typeRef<List<Topic.Link>>())
    val description = varchar("description")
    val exportedScore = int("exported_score")
    val cachedCount = int("cached_count")
    val cachedAnnotations = json("cached_annotations", typeRef<List<Topic.CachedAnnotation>>())

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Topic(
        id = row[id]!!,
        name = row[name]!!,
        otherNames = row[otherNames]!!,
        parentId = row[parentId],
        type = row[type]!!,
        score = row[score],
        favorite = row[favorite]!!,
        links = row[links],
        description = row[description]!!,
        exportedScore = row[exportedScore],
        cachedCount = row[cachedCount]!!,
        cachedAnnotations = row[cachedAnnotations]
    )
}