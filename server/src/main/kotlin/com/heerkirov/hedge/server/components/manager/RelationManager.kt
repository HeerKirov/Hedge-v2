package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.utils.RelationGraph
import me.liuwj.ktorm.dsl.*

class RelationManager(private val data: DataRepository) {
    /**
     * 校验裙带关系relations。检测所给出的relations是否全部存在且可用。
     */
    fun validateRelations(relations: List<Int>) {
        val relationResult = data.db.from(Illusts).select(Illusts.id).where { Illusts.id inList relations }.map { it[Illusts.id]!! }
        if(relationResult.size < relations.size) {
            throw ResourceNotExist("relations", relations.toSet() - relationResult.toSet())
        }
    }

    /**
     * 处理裙带关系的exported relations，将关系模型传播至所有关联的项目。
     * @param oldRelations 更新一个已存在的项目时，需要给出旧的关系模型。
     */
    fun processExportedRelations(thisId: Int, relations: List<Int>, oldRelations: List<Int>? = null, oldExportedRelations: List<Int>? = null) {
        val relationSet = relations.toSet()
        val oldRelationSet = oldRelations?.toSet()
        if(relationSet == oldRelationSet) {
            return
        }

        val elements = mutableMapOf<Int, Element>()
        //放入this
        elements[thisId] = Element(thisId, oldRelations ?: emptyList(), oldExportedRelations ?: emptyList())
        //放入由this的旧依赖拓扑查到的所有element
        if(!oldExportedRelations.isNullOrEmpty()) elements.putAll(findAll(oldExportedRelations).asSequence().map { Pair(it.id, it) })
        //放入新旧对比之后新增的部分
        val adds = findAll(relationSet - (oldRelationSet ?: emptySet()) - elements.keys)
        elements.putAll(adds.asSequence().map { Pair(it.id, it) })
        //放入新增部分的依赖拓扑
        elements.putAll(findAll(adds.flatMap { it.exportedRelations } - elements.keys).asSequence().map { Pair(it.id, it) })

        //生成拓扑图
        val graph = RelationGraph(elements.values.toTypedArray(), elements.values.asSequence().flatMap { element ->
            (if(element.id == thisId) relations else element.relations).map { Pair(element, elements[it]!!) }
        })

        data.db.batchUpdate(Illusts) {
            for (element in elements.values) {
                if(element.id != thisId) {
                    val newExportedRelations = graph[element].map { it.id }
                    if(newExportedRelations != element.exportedRelations) {
                        item {
                            where { it.id eq element.id }
                            set(it.exportedRelations, newExportedRelations)
                        }
                    }
                }else{
                    item {
                        where { it.id eq element.id }
                        set(it.exportedRelations, graph[element].map(Element::id))
                    }
                }
            }
        }
    }

    /**
     * 欲删除一个项，因此从它的关系拓扑的所有项中剔除自己。
     */
    fun removeItemInRelations(thisId: Int, relations: List<Int>) {
        val elements = mutableMapOf<Int, Element>()
        //将全量拓扑的关联节点全部放入集合
        elements.putAll(findAll(relations).map { Pair(it.id, it) })

        //发生变化的relation集合
        val relationChanges = mutableMapOf<Int, List<Int>>()
        //生成拓扑图
        val graph = RelationGraph(elements.values.toTypedArray(), elements.values.asSequence().flatMap { element ->
            val newRelations = element.relations.filter { it != thisId }
            if(newRelations.size < element.relations.size) {
                relationChanges[element.id] = newRelations
            }
            newRelations.map { Pair(element, elements[it]!!) }
        })

        //保存更改
        data.db.batchUpdate(Illusts) {
            for (element in elements.values) {
                val newRelations = relationChanges[element.id]
                val newExportedRelations = graph[element].map { it.id }
                if(newRelations != null || element.exportedRelations != newExportedRelations) {
                    item {
                        where { it.id eq element.id }
                        set(it.relations, newRelations)
                        set(it.exportedRelations, newExportedRelations)
                    }
                }
            }
        }
    }

    private fun findAll(ids: Collection<Int>): List<Element> {
        return data.db.from(Illusts)
            .select(Illusts.id, Illusts.relations, Illusts.exportedRelations)
            .where { Illusts.id inList ids }
            .limit(0, ids.size)
            .map { Element(it[Illusts.id]!!, it[Illusts.relations] ?: emptyList(), it[Illusts.exportedRelations] ?: emptyList()) }
    }

    private data class Element(val id: Int, val relations: List<Int>, val exportedRelations: List<Int>) {
        override fun hashCode() = id
        override fun equals(other: Any?) = this === other || (other is Element && this.id == other.id)
    }
}