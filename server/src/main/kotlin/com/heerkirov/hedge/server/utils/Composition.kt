package com.heerkirov.hedge.server.utils

import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.KClass

abstract class Composition<T : Composition<T>>(clazz: KClass<T>, val value: Int) {
    private val newInstance = compositionConstructorOf(clazz)

    operator fun plus(target: Composition<T>): T {
        return newInstance(value or target.value)
    }

    operator fun contains(element: Composition<T>): Boolean {
        return element.value and value.inv() == 0
    }

    override fun equals(other: Any?): Boolean {
        return if(other is Composition<*>) {
            other.value == value
        }else{
            false
        }
    }

    override fun hashCode(): Int {
        return value
    }

    override fun toString(): String {
        return "${this::class.simpleName}{value=$value}"
    }
}

fun <T : Composition<T>> compositionConstructorOf(clazz: KClass<T>): (Int) -> T {
    val caches: MutableMap<Int, T> = ConcurrentHashMap()

    for (constructor in clazz.constructors) {
        val parameters = constructor.parameters
        if(parameters.size == 1 && parameters[0].type.classifier == Int::class) {
            return { caches[it] ?: constructor.call(it).also { v -> caches[it] = v } }
        }
    }
    throw ReflectiveOperationException("Type ${clazz.qualifiedName} not have constructor(Int).")
}
