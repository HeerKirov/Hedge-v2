package com.heerkirov.hedge.server.dao.meta

import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.model.meta.Author
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import com.heerkirov.hedge.server.utils.ktorm.unionList
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*
import java.time.LocalDateTime

object Authors : MetaTag<Author>("author", schema = "meta_db") {
    override val id = int("id").primaryKey()
    override val name = varchar("name")
    override val otherNames = unionList("other_names")
    val keywords = unionList("keywords")
    val type = enum("type", typeRef<Author.Type>())
    val score = int("score")
    val favorite = boolean("favorite")
    val links = json("links", typeRef<List<Author.Link>>())
    val description = varchar("description")
    val exportedScore = int("exported_score")
    override val cachedCount = int("cached_count")
    val cachedAnnotations = json("cached_annotations", typeRef<List<Author.CachedAnnotation>>())
    val createTime = datetime("create_time")
    override val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Author(
        id = row[id]!!,
        name = row[name]!!,
        otherNames = row[otherNames]!!,
        keywords = row[keywords]!!,
        type = row[type]!!,
        score = row[score],
        favorite = row[favorite]!!,
        links = row[links],
        description = row[description]!!,
        exportedScore = row[exportedScore],
        cachedCount = row[cachedCount]!!,
        cachedAnnotations = row[cachedAnnotations],
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}