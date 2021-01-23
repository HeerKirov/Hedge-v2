package com.heerkirov.hedge.server.library.compiler.grammar.syntax

import com.heerkirov.hedge.server.library.compiler.grammar.expression.Expression
import com.heerkirov.hedge.server.library.compiler.grammar.expression.ExpressionItem
import com.heerkirov.hedge.server.library.compiler.grammar.expression.NonTerminalItem

/**
 * 执行将文法产生式编译为语法分析表的过程。
 */
object SyntaxTableBuilder {
    /**
     * 给出一组文法产生式。构造一张语法分析表。
     */
    fun <T : Enum<T>> parse(originExpressions: List<Expression<T>>) {
        //添加一条根产生式S' -> S
        val rootExpression = SyntaxExpression(0, null, listOf(NonTerminalItem(originExpressions.first().key)))
        //构建全部产生式
        val expressions = listOf(rootExpression) + originExpressions.mapIndexed { i, (key, sequence) -> SyntaxExpression(i + 1, key, sequence) }
        //1. 首先，需要构造增广文法的自动机。
        val states = FamilyBuilder(expressions).parse()
        //2. 得到自动机后，使用自动机构造分析表。
    }
}

internal typealias SyntaxItemSet<T> = Set<SyntaxItem<T>>

/**
 * 语法分析器中的项。记录值为产生式的下标和next的点的下标。
 */
internal class SyntaxItem<T : Enum<T>>(val expression: SyntaxExpression<T>, val next: Int) {
    /**
     * 判断这个项的·是否位于最末尾。
     */
    private fun isAtEnd(): Boolean = next >= expression.sequence.size

    /**
     * 判断这个项的·是否不是位于末尾的。
     */
    fun isNotAtEnd(): Boolean = !isAtEnd()

    /**
     * 获得·所指的产生式中的下一个文法符号。
     * @throws IndexOutOfBoundsException 不会做存在性判断，因此如果·位于末尾会抛出此异常。
     */
    val nextExpressionItem: ExpressionItem<T> = expression.sequence[next]

    override fun equals(other: Any?): Boolean = other === this || (other is SyntaxItem<*> && other.expression == this.expression && other.next == this.next)

    override fun hashCode(): Int = expression.hashCode() * 31 + next
}

/**
 * 文法产生式。
 */
internal class SyntaxExpression<T : Enum<T>>(val index: Int, private val _key: T?, val sequence: List<ExpressionItem<T>>) {
    val key: T get() = _key ?: throw TypeCastException("This is a root expression.")

    fun isRoot(): Boolean = _key == null

    fun isNotRoot(): Boolean = _key != null

    override fun equals(other: Any?): Boolean = this === other || (other is SyntaxExpression<*> && other.index == this.index)

    override fun hashCode(): Int = index
}