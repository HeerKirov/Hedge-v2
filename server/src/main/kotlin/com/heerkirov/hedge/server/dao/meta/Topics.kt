package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

open class Topics(alias: String?) : MetaTag<Topic>("topic", schema = "meta_db", alias = alias) {
    companion object : Topics(null)
    override fun aliased(alias: String) = Topics(alias)

    override val id = int("id").primaryKey()
    override val name = varchar("name")
    override val otherNames = unionList("other_names")
    val keywords = unionList("keywords")
    val parentId = int("parent_id")
    val parentRootId = int("parent_root_id")
    val type = enum("type", typeRef<Topic.Type>())
    val score = int("score")
    val favorite = boolean("favorite")
    val links = json("links", typeRef<List<Topic.Link>>())
    val description = varchar("description")
    override val cachedCount = int("cached_count")
    val cachedAnnotations = json("cached_annotations", typeRef<List<Topic.CachedAnnotation>>())
    val createTime = datetime("create_time")
    override val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Topic(
        id = row[id]!!,
        name = row[name]!!,
        otherNames = row[otherNames]!!,
        keywords = row[keywords]!!,
        parentId = row[parentId],
        parentRootId = row[parentRootId],
        type = row[type]!!,
        score = row[score],
        favorite = row[favorite]!!,
        links = row[links],
        description = row[description]!!,
        cachedCount = row[cachedCount]!!,
        cachedAnnotations = row[cachedAnnotations],
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}