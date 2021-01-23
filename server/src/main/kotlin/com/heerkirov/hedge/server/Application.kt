package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.library.compiler.grammar.SyntaxTableBuilder
import com.heerkirov.hedge.server.library.compiler.grammar.prodExpressions
import com.heerkirov.hedge.server.utils.Parameters
import kotlin.system.exitProcess

fun main(args: Array<String>) {

    testCompiler()

    val parameters = Parameters(args)

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

fun testCompiler() {
    SyntaxTableBuilder.parse(prodExpressions)
    exitProcess(0)
}