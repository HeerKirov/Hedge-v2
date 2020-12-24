package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.Authors
import com.heerkirov.hedge.server.dao.Tags
import com.heerkirov.hedge.server.dao.Topics
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import me.liuwj.ktorm.dsl.*

class MetaManager(private val data: DataRepository) {
    /**
     * 该方法使用在设置tag时，对tag进行校验并导出，返回声明式的tag列表。
     * @return 一组tag。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun exportTag(tags: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Tags).select(Tags.id).where { Tags.id inList tags }.map { it[Tags.id]!! }
        if(ids.size < tags.size) {
            throw ResourceNotExist("tags", tags.toSet() - ids.toSet())
        }

        TODO("tag的导出")
    }

    /**
     * 该方法使用在设置topic时，对topic进行校验并导出，返回声明式的topic列表。
     * @return 一组topic。Int表示topic id，Boolean表示此topic是否为导出tag。
     */
    fun exportTopic(topics: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Topics).select(Topics.id).where { Topics.id inList topics }.map { it[Topics.id]!! }
        if(ids.size < topics.size) {
            throw ResourceNotExist("topics", topics.toSet() - ids.toSet())
        }

        TODO("topic的导出")
    }

    /**
     * 该方法使用在设置author时，对author进行校验并导出，返回声明式的author列表。
     * @return 一组author。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun exportAuthor(authors: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Authors).select(Authors.id).where { Authors.id inList authors }.map { it[Authors.id]!! }
        if(ids.size < authors.size) {
            throw ResourceNotExist("authors", authors.toSet() - ids.toSet())
        }

        //author类型的标签没有导出机制，因此直接返回结果。
        return authors.map { Pair(it, false) }
    }
}