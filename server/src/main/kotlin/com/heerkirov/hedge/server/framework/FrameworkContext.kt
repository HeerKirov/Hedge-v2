package com.heerkirov.hedge.server.framework

import kotlin.reflect.KClass

interface FrameworkContext {
    fun <T : Component> getComponent(clazz: KClass<T>): T

    fun getComponents(): List<Component>

    fun getExceptions(): List<Exception>
}

inline fun <reified T : Component> FrameworkContext.getComponent(): T {
    return this.getComponent(T::class)
}