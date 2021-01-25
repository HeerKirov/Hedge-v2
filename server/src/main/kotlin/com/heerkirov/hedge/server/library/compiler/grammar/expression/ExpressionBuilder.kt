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
            when {
                it is String -> SymbolItem(it)
                it is Enum<*> -> {
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

    override fun toString(): String = "SequenceItem"
}

class EOFItem<T : Enum<T>> : TerminalItem<T, Morpheme>  {
    override fun equals(other: Any?): Boolean = other === this || other is EOFItem<*>

    override fun hashCode(): Int = javaClass.hashCode()

    override fun toString(): String = "EOFItem"
}

class EmptyItem<T : Enum<T>> : TerminalItem<T, Morpheme> {
    override fun equals(other: Any?): Boolean = other === this || other is EmptyItem<*>

    override fun hashCode(): Int = javaClass.hashCode()

    override fun toString(): String = "EmptyItem"
}

//TODO 类图设计重构
//     目前的类设计，syntax和expression的构造类耦合。
//     在产生式构造器体系中被迫加入了与产生式构造无关的内容，比如增广文法的S'开始符号、FOLLOW和状态机中的EOF符号、FIRST中的∑符号
//     后续的变化目标是将这两者的类剥离，不再耦合，也避免无关内容的渗透。