package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.utils.Parameters
import java.util.regex.Pattern
import kotlin.system.exitProcess

fun main(args: Array<String>) {
    val parameters = Parameters(args)

    test()

    runApplication(
        ApplicationOptions(
            channel = parameters["--channel"]!!,
            userDataPath = parameters["--user-data"]!!,
            frontendFromFolder = parameters["--frontend-from-folder"],
            debugMode = parameters.contain("--debug-mode"),
            permanent = parameters.contain("--permanent"),
            forcePort = parameters["--force-port"]?.toInt(),
            forceToken = parameters["--force-token"]
        )
    )
}

fun test() {
    val pattern = Pattern.compile("""(\d+)_p(\d+)""")

    val matcher = pattern.matcher("98120954_p0")
    println(matcher.find())
    println(matcher.groupCount())
    println(matcher.group(0))
    println(matcher.group(1))
    println(matcher.group(2))
    println(matcher.find())

    exitProcess(0)
}