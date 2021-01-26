package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.library.compiler.grammar.definintion.printSyntaxTable
import com.heerkirov.hedge.server.library.compiler.grammar.definintion.readSyntaxExpression
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.SyntaxTableBuilder
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
    val testExpressions = """
        E -> E + T
        E -> T
        T -> T * F
        T -> F
        F -> ( E )
        F -> id
    """.trimIndent()
    val syntaxExpressions = readSyntaxExpression(testExpressions)
    val syntaxTable = SyntaxTableBuilder.parse(syntaxExpressions)
    println(printSyntaxTable(syntaxTable))

    exitProcess(0)
}