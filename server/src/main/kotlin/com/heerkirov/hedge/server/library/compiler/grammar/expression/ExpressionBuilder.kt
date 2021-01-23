package com.heerkirov.hedge.server.library.compiler.grammar.expression

import com.heerkirov.hedge.server.library.compiler.lexical.Morpheme
import com.heerkirov.hedge.server.library.compiler.lexical.Symbol
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence

/**
 * 构造一组产生式。
 */
fun <T : Enum<T>> grammarExpression(block: ExpressionsBuilder<T>.() -> Unit): List<Expression<T>> {
    val builder = ExpressionsBuilder<T>()
    builder.block()
    return builder.expressions
}

/**
 * 用于构造产生式的构造器。
 */
class ExpressionsBuilder<T : Enum<T>> {
    internal val expressions: MutableList<Expression<T>> = mutableListOf()

    val string = Any()

    /**
     * 以自由的方式添加一个新的产生式。它接受如下类型的参数：
     * - String:"?": 指代一个Morpheme:Symbol。
     * - string: 指代一个字符串Morpheme:CharSequence。
     * - T.?: 指代一个非终结符。
     */
    infix fun T.to(items: List<Any>) {
        expressions.add(Expression(this, items.map {
            when (it) {
                is String -> SymbolItem(it)
                is Enum<*> -> {
                    @Suppress("UNCHECKED_CAST")
                    NonTerminalItem(it as T)
                }
                it === string -> SequenceItem()
                else -> throw IllegalArgumentException("$it is not a legal production item.")
            }
        }))
    }
}

data class Expression<T : Enum<T>>(val key: T, val sequence: List<ExpressionItem<T>>)

interface ExpressionItem<T : Enum<T>>

interface TerminalItem<T : Enum<T>, M : Morpheme> : ExpressionItem<T>

data class NonTerminalItem<T : Enum<T>>(val productionKey: T) : ExpressionItem<T>

data class SymbolItem<T : Enum<T>>(val symbol: String) : TerminalItem<T, Symbol>

class SequenceItem<T : Enum<T>> : TerminalItem<T, CharSequence> {
    override fun equals(other: Any?): Boolean = other === this || other is SequenceItem<*>

    override fun hashCode(): Int = javaClass.hashCode()
}