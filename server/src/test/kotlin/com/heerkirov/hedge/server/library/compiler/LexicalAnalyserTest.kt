package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequenceType
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalItem
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import kotlin.test.Test
import kotlin.test.assertEquals

class LexicalAnalyserTest {
    @Test
    fun testBasically() {
        assertEquals(AnalysisResult(emptyList()), LexicalAnalyzer.parse(""))
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "meta"), 0, 4)
        )), LexicalAnalyzer.parse("meta"))
    }
}