package com.heerkirov.hedge.server.library.compiler.grammar

import com.heerkirov.hedge.server.library.compiler.grammar.definintion.*
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalItem
import com.heerkirov.hedge.server.library.compiler.lexical.Morpheme
import com.heerkirov.hedge.server.library.compiler.lexical.Space
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.lexical.Symbol
import com.heerkirov.hedge.server.utils.Resources
import java.util.*

/**
 * 语法分析器。执行词素 -> AST语法树的步骤和AST语法树 -> 语义语法树的步骤。
 */
object GrammarAnalyzer {
    private val syntaxExpressions = readSyntaxExpression(Resources.getResourceAsText("syntax/syntax.txt")).associateBy { it.index }
    private val syntaxTable = readSyntaxTable(Resources.getResourceAsText("syntax/syntax-table.txt"))

    /**
     * 执行语法分析。
     */
    fun parse(lexicalList: List<LexicalItem>) {
        run(process(lexicalList))
    }

    /**
     * 对词素序列做预处理，去掉空格词素，添加EOF词素。
     */
    private fun process(lexicalList: List<LexicalItem>): List<LexicalItem> {
        val eofIndex = lexicalList.last().endIndex
        return lexicalList.filter { it.morpheme !is Space } + LexicalItem(Symbol.of("∑"), eofIndex, eofIndex + 1)
    }

    /**
     * 执行语法分析。
     */
    private fun run(lexicalList: List<LexicalItem>) {
        //状态栈。将0压栈作为初始状态
        val stack = LinkedList<Int>().also { it.add(0) }
        //符号栈。这不是语法分析的必须品，只是为了可视化
        val symbolStack = LinkedList<String>()
        //读词素的索引
        var readIndex = 0

        var step = 0
        while (true) {
            val a = if(readIndex < lexicalList.size) morphemeToNotation(lexicalList[readIndex].morpheme) else "∑"
            val s = stack.peek()
            //查ACTION[stack.peek(), 下一个输入]，根据动作做决定
            val action = syntaxTable.getAction(s, a)

            println(String.format("%5s stack[%-30s] symbol[%-60s] input[%-25s] action: %s", "($step)",
                stack.reversed().joinToString(" "),
                symbolStack.reversed().joinToString(" "),
                lexicalList.subList(readIndex, lexicalList.size).joinToString(" ") { morphemeToNotation(it.morpheme) }.let { if(it.length > 25) it.substring(0, 25) else it },
                action
            ))

            if(action == null) {
                //错误：调用错误例程
                //TIPS：这里的错误应当是告知存在预料之外的词素类型
                throw RuntimeException("Grammar analysis error: Unexpected symbol $a.")
            }else when (action) {
                is Shift -> {
                    //移入：将SHIFT(status)的状态移入栈中，并使读取的符号后推1
                    stack.push(action.status)
                    symbolStack.push(a)
                    readIndex += 1
                }
                is Reduce -> {
                    //规约：从栈中弹出|expression|个状态，将GOTO[stack.peek(), expression.key]压栈
                    val reduceExpression = syntaxExpressions[action.syntaxExpressionIndex]!!
                    reduceExpression.sequence.indices.forEach { _ ->
                        stack.pop()
                        symbolStack.pop()
                    }
                    stack.push(syntaxTable.getGoto(stack.peek(), reduceExpression.key.key))
                    symbolStack.push(reduceExpression.key.key)
                }
                is Accept -> {
                    //接受：语法分析完成
                    break
                }
                is Error -> {
                    //错误：调用错误例程
                    //TIPS: 目前还没有设计语法表的错误和错误恢复例程，遇到问题暂且全部抛出。
                    throw RuntimeException("Grammar analysis error: Code ${action.code}")
                }
            }
            step += 1
        }
    }

    /**
     * 把词素转换为语法表中的文法符号。
     */
    private fun morphemeToNotation(morpheme: Morpheme): String {
        return when (morpheme) {
            is Symbol -> morpheme.symbol
            is CharSequence -> "str"
            else -> throw UnsupportedOperationException("Unsupported morpheme $morpheme.")
        }
    }
}