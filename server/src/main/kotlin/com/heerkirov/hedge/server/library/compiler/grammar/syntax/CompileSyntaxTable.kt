package com.heerkirov.hedge.server.library.compiler.grammar.syntax

import com.heerkirov.hedge.server.library.compiler.grammar.definintion.printSyntaxTable
import com.heerkirov.hedge.server.library.compiler.grammar.definintion.readSyntaxExpression
import com.heerkirov.hedge.server.utils.Resources

/**
 * 从资源文件读产生式的定义，打印语法分析表。
 */
fun main() {
    val expressionDefinition = Resources.getResourceAsText("syntax/syntax.txt")
    val syntaxExpression = readSyntaxExpression(expressionDefinition)
    val syntaxTable = SyntaxTableBuilder.parse(syntaxExpression)
    println(printSyntaxTable(syntaxTable))
}