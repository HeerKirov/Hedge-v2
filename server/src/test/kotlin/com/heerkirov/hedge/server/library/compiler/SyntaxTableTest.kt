package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.grammar.expression.*
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.*
import kotlin.test.Test
import kotlin.test.assertEquals

class SyntaxTableTest {
    @Test
    fun testClosure() {
        val expressions = listOf(
            SyntaxExpression(0, null, listOf(NonTerminalItem(Prod.E))),
            SyntaxExpression(1, Prod.E, listOf(NonTerminalItem(Prod.E), SymbolItem("+"), NonTerminalItem(Prod.T))),
            SyntaxExpression(2, Prod.E, listOf(NonTerminalItem(Prod.T))),
            SyntaxExpression(3, Prod.T, listOf(NonTerminalItem(Prod.T), SymbolItem("*"), NonTerminalItem(Prod.F))),
            SyntaxExpression(4, Prod.T, listOf(NonTerminalItem(Prod.F))),
            SyntaxExpression(5, Prod.F, listOf(SymbolItem("("), NonTerminalItem(Prod.E), SymbolItem(")"))),
            SyntaxExpression(6, Prod.F, listOf(SequenceItem())),
        )
        val familyBuilder = FamilyBuilder(expressions)

        assertEquals(setOf(
            SyntaxItem(expressions[0], 0),
            SyntaxItem(expressions[1], 0),
            SyntaxItem(expressions[2], 0),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.closure(setOf(SyntaxItem(expressions[0], 0))))

        assertEquals(setOf(
            SyntaxItem(expressions[5], 1),
            SyntaxItem(expressions[1], 0),
            SyntaxItem(expressions[2], 0),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.closure(setOf(SyntaxItem(expressions[5], 1))))

        assertEquals(setOf(
            SyntaxItem(expressions[1], 2),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.closure(setOf(SyntaxItem(expressions[1], 2))))
    }

    @Test
    fun testGoto() {
        val expressions = listOf(
            SyntaxExpression(0, null, listOf(NonTerminalItem(Prod.E))),
            SyntaxExpression(1, Prod.E, listOf(NonTerminalItem(Prod.E), SymbolItem("+"), NonTerminalItem(Prod.T))),
            SyntaxExpression(2, Prod.E, listOf(NonTerminalItem(Prod.T))),
            SyntaxExpression(3, Prod.T, listOf(NonTerminalItem(Prod.T), SymbolItem("*"), NonTerminalItem(Prod.F))),
            SyntaxExpression(4, Prod.T, listOf(NonTerminalItem(Prod.F))),
            SyntaxExpression(5, Prod.F, listOf(SymbolItem("("), NonTerminalItem(Prod.E), SymbolItem(")"))),
            SyntaxExpression(6, Prod.F, listOf(SequenceItem())),
        )
        val familyBuilder = FamilyBuilder(expressions)

        val i0 = familyBuilder.closure(setOf(SyntaxItem(expressions[0], 0)))

        assertEquals(setOf(
            SyntaxItem(expressions[0], 1),
            SyntaxItem(expressions[1], 1),
        ), familyBuilder.goto(i0, NonTerminalItem(Prod.E)))

        assertEquals(setOf(
            SyntaxItem(expressions[2], 1),
            SyntaxItem(expressions[3], 1),
        ), familyBuilder.goto(i0, NonTerminalItem(Prod.T)))

        assertEquals(setOf(
            SyntaxItem(expressions[4], 1),
        ), familyBuilder.goto(i0, NonTerminalItem(Prod.F)))

        assertEquals(setOf(
            SyntaxItem(expressions[6], 1),
        ), familyBuilder.goto(i0, SequenceItem()))

        assertEquals(setOf(
            SyntaxItem(expressions[5], 1),
            SyntaxItem(expressions[1], 0),
            SyntaxItem(expressions[2], 0),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.goto(i0, SymbolItem("(")))

        assertEquals(setOf(
            SyntaxItem(expressions[1], 2),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.goto(setOf(
            SyntaxItem(expressions[1], 1),
            SyntaxItem(expressions[2], 1),
        ), SymbolItem("+")))
    }

    enum class Prod {
        E, T, F
    }
}