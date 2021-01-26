package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.grammar.definintion.KeyNotation
import com.heerkirov.hedge.server.library.compiler.grammar.definintion.SyntaxNotation
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.ExpandExpression
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.SyntaxFamilyBuilder
import com.heerkirov.hedge.server.library.compiler.grammar.syntax.SyntaxItem
import kotlin.test.Test
import kotlin.test.assertEquals

class SyntaxTableTest {
    @Test
    fun testClosure() {
        val expressions = listOf(
            ExpandExpression(0, null, listOf(KeyNotation.of("E"))),
            ExpandExpression(1, KeyNotation.of("E"), listOf(KeyNotation.of("E"), SyntaxNotation.of("+"), KeyNotation.of("T"))),
            ExpandExpression(2, KeyNotation.of("E"), listOf(KeyNotation.of("T"))),
            ExpandExpression(3, KeyNotation.of("T"), listOf(KeyNotation.of("T"), SyntaxNotation.of("*"), KeyNotation.of("F"))),
            ExpandExpression(4, KeyNotation.of("T"), listOf(KeyNotation.of("F"))),
            ExpandExpression(5, KeyNotation.of("F"), listOf(SyntaxNotation.of("("), KeyNotation.of("E"), SyntaxNotation.of(")"))),
            ExpandExpression(6, KeyNotation.of("F"), listOf(SyntaxNotation.of("id"))),
        )
        val familyBuilder = SyntaxFamilyBuilder(expressions)

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
            ExpandExpression(0, null, listOf(KeyNotation.of("E"))),
            ExpandExpression(1, KeyNotation.of("E"), listOf(KeyNotation.of("E"), SyntaxNotation.of("+"), KeyNotation.of("T"))),
            ExpandExpression(2, KeyNotation.of("E"), listOf(KeyNotation.of("T"))),
            ExpandExpression(3, KeyNotation.of("T"), listOf(KeyNotation.of("T"), SyntaxNotation.of("*"), KeyNotation.of("F"))),
            ExpandExpression(4, KeyNotation.of("T"), listOf(KeyNotation.of("F"))),
            ExpandExpression(5, KeyNotation.of("F"), listOf(SyntaxNotation.of("("), KeyNotation.of("E"), SyntaxNotation.of(")"))),
            ExpandExpression(6, KeyNotation.of("F"), listOf(SyntaxNotation.of("id"))),
        )
        val familyBuilder = SyntaxFamilyBuilder(expressions)

        val i0 = familyBuilder.closure(setOf(SyntaxItem(expressions[0], 0)))

        assertEquals(setOf(
            SyntaxItem(expressions[0], 1),
            SyntaxItem(expressions[1], 1),
        ), familyBuilder.goto(i0, KeyNotation.of("E")))

        assertEquals(setOf(
            SyntaxItem(expressions[2], 1),
            SyntaxItem(expressions[3], 1),
        ), familyBuilder.goto(i0, KeyNotation.of("T")))

        assertEquals(setOf(
            SyntaxItem(expressions[4], 1),
        ), familyBuilder.goto(i0, KeyNotation.of("F")))

        assertEquals(setOf(
            SyntaxItem(expressions[6], 1),
        ), familyBuilder.goto(i0, SyntaxNotation.of("id")))

        assertEquals(setOf(
            SyntaxItem(expressions[5], 1),
            SyntaxItem(expressions[1], 0),
            SyntaxItem(expressions[2], 0),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.goto(i0, SyntaxNotation.of("(")))

        assertEquals(setOf(
            SyntaxItem(expressions[1], 2),
            SyntaxItem(expressions[3], 0),
            SyntaxItem(expressions[4], 0),
            SyntaxItem(expressions[5], 0),
            SyntaxItem(expressions[6], 0),
        ), familyBuilder.goto(setOf(
            SyntaxItem(expressions[1], 1),
            SyntaxItem(expressions[2], 1),
        ), SyntaxNotation.of("+")))
    }
}