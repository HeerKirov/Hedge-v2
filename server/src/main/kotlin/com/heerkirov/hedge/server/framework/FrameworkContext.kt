package com.heerkirov.hedge.server.framework

import kotlin.reflect.KClass

interface FrameworkContext {
    fun <T : Component> getComponent(clazz: KClass<T>): T

    fun getComponents(): List<Component>

    fun getExceptions(): List<Exception>
}