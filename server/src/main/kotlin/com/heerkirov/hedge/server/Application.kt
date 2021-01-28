package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.utils.Parameters
import org.slf4j.LoggerFactory
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
    val log = LoggerFactory.getLogger("testCompiler")
    val lexicalResult = LexicalAnalyzer.parse("order:+^id,-p id:{1, 2, 3?}|description: 'hello' [@#fav|like] @a.b|'c'.`d` rating:[A, D)|B~+|A~D|rating>=E")
    lexicalResult.warnings.forEach { log.warn(it.toString()) }
    lexicalResult.errors.forEach { log.error(it.toString()) }
    if(lexicalResult.result != null) {
        GrammarAnalyzer.parse(lexicalResult.result)
    }
    exitProcess(0)
}