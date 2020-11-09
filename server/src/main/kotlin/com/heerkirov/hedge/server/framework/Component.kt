package com.heerkirov.hedge.server.framework

import java.io.Closeable

/**
 * 通用组件。
 * 在系统关闭时，执行组件的close方法以关闭资源。
 */
interface Component : Closeable {
    override fun close() { }
}

/**
 * 有状态的组件。特点是可能在自身内部维护状态，表现为其空闲标记。
 * 当存在非空闲的组件时，系统不应该被shutdown。
 */
interface StatefulComponent : Component {
    /**
     * 判断当前组件是否空闲。
     */
    val isIdle: Boolean
}