package com.heerkirov.hedge.server.utils

fun <T, R> Iterator<T>.map (transform: (T) -> R): List<R> {
    val list = arrayListOf<R>()
    this.forEach { list.add(transform(it)) }
    return list
}

inline fun <T> T.applyIf(predicate: Boolean, block: T.() -> Unit): T {
    if(predicate) {
        block(this)
    }
    return this
}