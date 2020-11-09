package com.heerkirov.hedge.server.application

class ApplicationOptions(
    /**
     * server的启动频道。
     */
    val channel: String,
    /**
     * userData目录路径。
     */
    val userDataPath: String,
    /**
     * 告知server以调试模式启动。
     */
    val debugMode: Boolean = false,
    /**
     * 告知server直接以permanent模式启动。
     */
    val permanent: Boolean = false,
    /**
     * 从此文件夹，而不是userData目录下的预定路径，取用前端资源。
     */
    val frontendFromFolder: String? = null
)