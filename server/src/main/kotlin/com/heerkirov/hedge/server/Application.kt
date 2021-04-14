package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.utils.Parameters

fun main(args: Array<String>) {
    val parameters = Parameters(args)

    runApplication(
        ApplicationOptions(
            channelPath = parameters["--channel-path"]!!,
            frontendPath = parameters["--frontend-path"]!!,
            debugMode = parameters.contain("--debug-mode"),
            permanent = parameters.contain("--permanent"),
            forcePort = parameters["--force-port"]?.toInt(),
            forceToken = parameters["--force-token"]
        )
    )
}