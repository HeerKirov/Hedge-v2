package com.heerkirov.hedge.server.utils

import java.util.*
import kotlin.collections.HashMap

fun <T> Iterable<T>.duplicateCount(): Map<T, Int> {
    val map = HashMap<T, Int>()
    for (t in this) {
        map[t] = map.computeIfAbsent(t) { 0 } + 1
    }
    return map
}

inline fun <T> Iterable<T>.filterInto(condition: (T) -> Boolean): Pair<List<T>, List<T>> {
    val a = LinkedList<T>()
    val b = LinkedList<T>()
    for (t in this) {
        if(condition(t)) a.add(t) else b.add(t)
    }
    return a to b
}

inline fun <T> Sequence<T>.filterInto(condition: (T) -> Boolean): Pair<List<T>, List<T>> {
    val a = LinkedList<T>()
    val b = LinkedList<T>()
    for (t in this) {
        if(condition(t)) a.add(t) else b.add(t)
    }
    return a to b
}

inline fun <T, R> Iterator<T>.map (transform: (T) -> R): List<R> {
    val list = arrayListOf<R>()
    this.forEach { list.add(transform(it)) }
    return list
}

inline fun <T> List<T>.indexOfFirst(fromIndex: Int, predicate: (T) -> Boolean): Int {
    val iterator = this.listIterator(fromIndex)
    while (iterator.hasNext()) {
        if (predicate(iterator.next())) {
            return iterator.previousIndex()
        }
    }
    return -1
}

inline fun <T> List<T>.indexOfLast(fromIndex: Int, predicate: (T) -> Boolean): Int {
    val iterator = this.listIterator(fromIndex)
    while (iterator.hasPrevious()) {
        if (predicate(iterator.previous())) {
            return iterator.nextIndex()
        }
    }
    return -1
}

inline fun <T> T.applyIf(predicate: Boolean, block: T.() -> Unit): T {
    if(predicate) {
        block()
    }
    return this
}

inline fun <T> T.runIf(predicate: Boolean, block: T.() -> T): T {
    if(predicate) {
        return block()
    }
    return this
}


inline fun <T> T.letIf(predicate: Boolean, block: (T) -> T): T {
    if(predicate) {
        return block(this)
    }
    return this
}