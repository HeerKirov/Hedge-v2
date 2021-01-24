package com.heerkirov.hedge.server

import com.heerkirov.hedge.server.application.ApplicationOptions
import com.heerkirov.hedge.server.application.runApplication
import com.heerkirov.hedge.server.library.compiler.grammar.expression.EOFItem
import com.heerkirov.hedge.server.library.compiler.grammar.expression.SequenceItem
import com.heerkirov.hedge.server.library.compiler.grammar.expression.SymbolItem
import com.heerkirov.hedge.server.library.compiler.grammar.expression.grammarExpression
import com.heerkirov.hedge.server.library.compiler.grammar.prodExpressions
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.SyntaxItem
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

enum class Prod {
    E, T, F
}

fun testCompiler() {
    val tempExpressions = grammarExpression<Prod> {
        Prod.E to listOf(Prod.E, "+", Prod.T)
        Prod.E to listOf(Prod.T)
        Prod.T to listOf(Prod.T, "*", Prod.F)
        Prod.T to listOf(Prod.F)
        Prod.F to listOf("(", Prod.E, ")")
        Prod.F to listOf(string)
    }
    val table = SyntaxTableBuilder.parse(tempExpressions)
    println(table.toString(listOf(SequenceItem(), SymbolItem("+"), SymbolItem("*"), SymbolItem("("), SymbolItem(")"), EOFItem()), listOf(Prod.E, Prod.T, Prod.F)))
    exitProcess(0)
}