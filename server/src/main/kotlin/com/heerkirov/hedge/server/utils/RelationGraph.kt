package com.heerkirov.hedge.server.utils

import java.util.*
import kotlin.NoSuchElementException
import kotlin.collections.HashMap
import kotlin.collections.HashSet

class RelationGraph<E: Any>(private val elements: Array<E>, relations: Sequence<Pair<E, E>>) {
    private val map: MutableList<MutableList<Boolean>> = MutableList(elements.size) { MutableList(elements.size) { false } }
    private val hashMapper: MutableMap<Int, Int> = HashMap(elements.size)

    init {
        elements.forEachIndexed { i, element -> hashMapper[element.hashCode()] = i }
        relations.forEach { (from, to) ->
            val fromIndex = hashMapper[from.hashCode()] ?: throw NoSuchElementException("From element is not in graph.")
            val toIndex = hashMapper[to.hashCode()] ?: throw NoSuchElementException("To element is not in graph.")
            map[fromIndex][toIndex] = true
            map[toIndex][fromIndex] = true
        }
        elements.indices.forEach { spread(it) }
    }

    private fun spread(thisIndex: Int) {
        val been = HashSet<Int>()
        val queue = LinkedList<Int>()
        been.add(thisIndex)
        map[thisIndex].forEachIndexed { index, b ->
            if(b) {
                queue.add(index)
                been.add(index)
            }
        }

        while(queue.isNotEmpty()) {
            val currentIndex = queue.pop()
            map[currentIndex].forEachIndexed { goalIndex, b ->
                if(b) {
                    map[thisIndex][goalIndex] = true
                    if(goalIndex !in been) {
                        queue.add(goalIndex)
                        been.add(goalIndex)
                    }
                }
            }
        }
    }

    operator fun get(element: E): List<E> {
        return map[hashMapper[element.hashCode()]!!].asSequence()
            .mapIndexed { index, b -> Pair(index, b) }
            .filter { (_, b) -> b }
            .map { (i, _) -> i }
            .map { elements[it] }
            .toList()
    }
}