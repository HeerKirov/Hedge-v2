package com.heerkirov.hedge.server.definitions

/**
 * 相对于userData目录的各种文件的名称定义。
 */
object Filename {
    const val FRONTEND_FOLDER = "server/frontend"
    const val STATIC_FOLDER = "static"
    const val FRONTEND_INDEX = "index.html"
    const val FAVICON_ICO = "favicon.ico"

    const val CHANNEL = "appdata/channel"
    const val SERVER_PID = "server.pid"
    const val DATA_DAT = "data.dat"

    const val META_DAT = "meta.dat"
    const val DATA_SQLITE = "data.sqlite"
    const val META_SQLITE = "meta.sqlite"
    const val ORIGIN_SQLITE = "origin.sqlite"
    const val SOURCE_SQLITE = "source.sqlite"
    const val STATISTIC_SQLITE = "statistic.sqlite"
    const val VERSION_LOCK = "version"
}