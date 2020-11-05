package com.heerkirov.hedge.server.utils

import java.util.concurrent.ConcurrentHashMap

class Resources {
    private val resourceCaches: MutableMap<String, String> = ConcurrentHashMap()

    fun getResource(path: String): String {
        val resource = this.javaClass.getResource(path)!!
        return resourceCaches[path] ?: resource.readText().also {
            resourceCaches[path] = it
        }
    }
}