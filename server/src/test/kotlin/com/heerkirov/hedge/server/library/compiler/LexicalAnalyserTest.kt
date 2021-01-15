package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.lexical.*
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.LexicalError
import kotlin.test.Test
import kotlin.test.assertEquals

class LexicalAnalyserTest {
    @Test
    fun testCharSequence() {
        //空串
        assertEquals(AnalysisResult(emptyList()), LexicalAnalyzer.parse(""))
        //一个单字符串
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "meta"), 0, 4)
        )), LexicalAnalyzer.parse("meta"))
        //一个空格
        assertEquals(AnalysisResult(listOf(
            LexicalItem(Space, 0, 1)
        )), LexicalAnalyzer.parse(" "))
        //几个空格分隔的串
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a"), 0, 1),
            LexicalItem(Space, 1, 2),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "b"), 2, 3),
            LexicalItem(Space, 3, 4),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "c"), 4, 5),
        )), LexicalAnalyzer.parse("a b c"))
        //没有分隔的三种无限字符串
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.APOSTROPHE, "aa"), 0, 4),
            LexicalItem(CharSequence(CharSequenceType.DOUBLE_QUOTES, "bb"), 4, 8),
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "cc"), 8 ,12),
        )), LexicalAnalyzer.parse("""'aa'"bb"`cc`"""))
        //在受限串中间写字符串符号的警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a'b"), 0, 3)
        ), warnings = listOf<LexicalError>(
            FoundQuoteInRestrictedString('\'', 1)
        )), LexicalAnalyzer.parse("""a'b"""))
        //一个错误的写法，看上去是一个受限串接一个无限串，但实际上会被识别为一个被警告的受限串
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "ax`re`"), 0, 6)
        ), warnings = listOf<LexicalError>(
            FoundQuoteInRestrictedString('`', 2),
            FoundQuoteInRestrictedString('`', 5),
        )), LexicalAnalyzer.parse("""ax`re`"""))
        //不写无限串的结束符，而是直到EOF的警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "arf"), 0, 4)
        ), warnings = listOf<LexicalError>(
            ExpectQuoteButEOF('`', 4)
        )), LexicalAnalyzer.parse("""`arf"""))
    }

    @Test
    fun testEscape() {
        //试图在受限串写转义，但实际上没有转义，并且触发受限串中间符号的警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a\\'b"), 0, 4)
        ), warnings = listOf<LexicalError>(
            FoundQuoteInRestrictedString('\'', 2)
        )), LexicalAnalyzer.parse("""a\'b"""))
        //在三种无限串中间测试的转义符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.APOSTROPHE, "a'\"`\\\n\r\tb"), 0, 18),
            LexicalItem(Space, 18, 19),
            LexicalItem(CharSequence(CharSequenceType.DOUBLE_QUOTES, "a'\"`\\\n\r\tb"), 19, 37),
            LexicalItem(Space, 37, 38),
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "a'\"`\\\n\r\tb"), 38, 56),
            LexicalItem(Space, 56, 57),
        )), LexicalAnalyzer.parse("""'a\'\"\`\\\n\r\tb' "a\'\"\`\\\n\r\tb" `a\'\"\`\\\n\r\tb` """))
        //在转义符号后接EOF，引发警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "12CU"), 0, 6)
        ), warnings = listOf<LexicalError>(
            ExpectEscapedCharacterButEOF(6)
        )), LexicalAnalyzer.parse("""`12CU\"""))
        //在转义符号后接普通符号，引发警告
        //在转义符号后接EOF，引发警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.APOSTROPHE, "????"), 0, 7)
        ), warnings = listOf<LexicalError>(
            NormalCharacterEscaped('?', 5)
        )), LexicalAnalyzer.parse("""'???\?'"""))
    }

    @Test
    fun testSymbol() {
        //测试所有1位符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(Symbol.of("|"), 0, 1),
            LexicalItem(Symbol.of("/"), 1, 2),
            LexicalItem(Symbol.of("&"), 2, 3),
            LexicalItem(Symbol.of("+"), 3, 4),
            LexicalItem(Symbol.of("-"), 4, 5),
            LexicalItem(Symbol.of(">"), 5, 6),
            LexicalItem(Symbol.of("<"), 6, 7),
            LexicalItem(Symbol.of(":"), 7, 8),
            LexicalItem(Symbol.of("~"), 8, 9),
            LexicalItem(Symbol.of("["), 9, 10),
            LexicalItem(Symbol.of("]"), 10, 11),
            LexicalItem(Symbol.of("{"), 11, 12),
            LexicalItem(Symbol.of("}"), 12, 13),
            LexicalItem(Symbol.of("("), 13, 14),
            LexicalItem(Symbol.of(")"), 14, 15),
            LexicalItem(Symbol.of("@"), 15, 16),
            LexicalItem(Symbol.of("#"), 16, 17),
            LexicalItem(Symbol.of("$"), 17, 18),
            LexicalItem(Symbol.of("^"), 18, 19),
            LexicalItem(Symbol.of("!"), 19, 20),
            LexicalItem(Symbol.of("."), 20, 21),
            LexicalItem(Symbol.of(","), 21, 22),
        )), LexicalAnalyzer.parse("|/&+-><:~[]{}()@#$^!.,"))
        //测试所有2位符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(Symbol.of("++"), 0, 2),
            LexicalItem(Symbol.of("--"), 2, 4),
            LexicalItem(Symbol.of(">="), 4, 6),
            LexicalItem(Symbol.of("<="), 6, 8),
        )), LexicalAnalyzer.parse("++-->=<="))
        //测试2位符号和1位符号混排
        assertEquals(AnalysisResult(listOf(
            LexicalItem(Symbol.of("++"), 0, 2),
            LexicalItem(Symbol.of("+"), 2, 3),
            LexicalItem(Space, 3, 4),
            LexicalItem(Symbol.of("--"), 4, 6),
            LexicalItem(Symbol.of("-"), 6, 7),
            LexicalItem(Space, 7, 8),
            LexicalItem(Symbol.of("<"), 8, 9),
            LexicalItem(Space, 9, 10),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "="), 10, 11),
            LexicalItem(Space, 11, 12),
            LexicalItem(Symbol.of(">"), 12, 13),
            LexicalItem(Space, 13, 14),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "="), 14, 15),
        )), LexicalAnalyzer.parse("+++ --- < = > ="))
    }

    @Test
    fun testAll() {
        //与符号和非符号的混排
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a?"), 0, 2),
            LexicalItem(Symbol.of("|"), 2, 3),
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "b"), 3, 6),
            LexicalItem(Symbol.of("&"), 6, 7),
            LexicalItem(Symbol.of("-"), 7, 8),
            LexicalItem(Symbol.of("^"), 8, 9),
            LexicalItem(CharSequence(CharSequenceType.APOSTROPHE, "cd"), 9, 13),
            LexicalItem(Symbol.of("."), 13, 14),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "e"), 14, 15),
            LexicalItem(Space, 15, 16),
            LexicalItem(Symbol.of("["), 16, 17),
            LexicalItem(Symbol.of("#"), 17, 18),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "*f*"), 18, 21),
            LexicalItem(Symbol.of("]"), 21, 22),
        )), LexicalAnalyzer.parse("a?|`b`&-^'cd'.e [#*f*]"))
    }
}