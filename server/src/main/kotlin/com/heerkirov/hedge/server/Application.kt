package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.Application
import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.utils.Parameters

fun main(args: Array<String>) {
    val parameters = Parameters(args)

    Application(ApplicationOptions(
        channel = parameters["--channel"]!!,
        userDataPath = parameters["--user-data"]!!,
        frontendFromFolder = parameters["--frontend-from-folder"],
        debugMode = parameters.contain("--debug-mode"),
        permanent = parameters.contain("--permanent")
    ))
}