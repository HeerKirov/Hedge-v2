package com.heerkirov.hedge.server.components.health

data class ServerPID(
    val pid: Long,
    var port: Int?,
    var token: String?,
    val startTime: Long
)