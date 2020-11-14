package com.heerkirov.hedge.server.utils

import java.io.File

object Fs {
    inline fun <reified T> readFile(path: String): T? {
        val f = File(path)
        return if(f.exists()) { f.readText().parseJSONObject<T>() }else{ null }
    }

    fun <T> writeFile(path: String, content: T) {
        File(path).writeText(content.toJSONString())
    }

    fun readText(path: String): String? {
        val f = File(path)
        return if(f.exists()) { f.readText() }else{ null }
    }

    fun writeText(path: String, content: String) {
        File(path).writeText(content)
    }

    fun rm(path: String): Boolean {
        return File(path).delete()
    }

    fun mkdir(path: String) {
        val f = File(path)
        if(!f.exists()) {
            f.mkdirs()
        }
    }
}