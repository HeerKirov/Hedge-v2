package com.heerkirov.hedge.server.utils

import java.io.File

object Fs {
    fun exists(path: String): Boolean {
        return File(path).exists()
    }

    inline fun <reified T> readFile(path: String): T? {
        val f = File(path)
        return if(f.exists()) { f.readText().parseJSONObject<T>() }else{ null }
    }

    fun <T> writeFile(path: String, content: T) {
        File(path).writeText(content.toJSONString())
    }

    fun rm(path: String): Boolean {
        return File(path).delete()
    }

    fun mkdir(path: String) {
        if(!exists(path)) {
            File(path).mkdirs()
        }
    }
}