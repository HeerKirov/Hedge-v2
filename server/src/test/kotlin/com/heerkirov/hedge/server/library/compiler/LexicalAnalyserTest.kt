package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.lexical.*
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.LexicalError
import kotlin.test.Test
import kotlin.test.assertEquals

class LexicalAnalyserTest {
    @Test
    fun testString() {
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
        //不写无限串的结束符，直到EOF，收到警告
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, "arf"), 0, 4)
        ), warnings = listOf<LexicalError>(
            ExpectQuoteButEOF('`', 4)
        )), LexicalAnalyzer.parse("""`arf"""))
    }

    @Test
    fun testEscape() {
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
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.APOSTROPHE, "????1c"), 0, 11)
        ), warnings = listOf<LexicalError>(
            NormalCharacterEscaped('?', 5),
            NormalCharacterEscaped('1', 7),
            NormalCharacterEscaped('c', 9),
        )), LexicalAnalyzer.parse("""'???\?\1\c'"""))
    }

    @Test
    fun testRestrictedString() {
        //受限字符串中间的字符串符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a'b"), 0, 3),
            LexicalItem(Space, 3, 4),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "c\"d"), 4, 7),
            LexicalItem(Space, 7, 8),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "e`f"), 8, 11),
        )), LexicalAnalyzer.parse("""a'b c"d e`f"""))
        //受限字符串中间的转义符号。并不会转义，而是原样输出
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "a\\nb"), 0, 4)
        )), LexicalAnalyzer.parse("""a\nb"""))
        //受限字符串中可以使用的符号。这些符号原本就没有特殊含义
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "%"), 0, 1),
            LexicalItem(Space, 1, 2),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "*"), 2, 3),
            LexicalItem(Space, 3, 4),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "/"), 4, 5),
            LexicalItem(Space, 5, 6),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "_"), 6, 7),
            LexicalItem(Space, 7, 8),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "?"), 8, 9),
            LexicalItem(Space, 9, 10),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, ";"), 10, 11),
        )), LexicalAnalyzer.parse("""% * / _ ? ;"""))
        //受限字符串中可以使用的符号。这些符号是符号表中的符号，但是可以在非开头使用。后一项例证了它们不作为开头时，各自解析为符号。=比较特殊，因为它没有对应的单字符符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "1=@#$^!"), 0, 7),
            LexicalItem(Space, 7, 9),
            LexicalItem(Symbol.of("@"), 9, 10),
            LexicalItem(Symbol.of("#"), 10, 11),
            LexicalItem(Symbol.of("$"), 11, 12),
            LexicalItem(Symbol.of("^"), 12, 13),
            LexicalItem(Symbol.of("!"), 13, 14),
            LexicalItem(CharSequence(CharSequenceType.RESTRICTED, "="), 14, 15),
        )), LexicalAnalyzer.parse("""1=@#$^!  @#$^!="""))
    }

    @Test
    fun testStringAndSymbol() {
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

    @Test
    fun testSymbol() {
        //测试所有1位符号
        assertEquals(AnalysisResult(listOf(
            LexicalItem(Space, 0, 1),
            LexicalItem(Symbol.of("|"), 1, 2),
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
        )), LexicalAnalyzer.parse(" |&+-><:~[]{}()@#$^!.,"))
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

}