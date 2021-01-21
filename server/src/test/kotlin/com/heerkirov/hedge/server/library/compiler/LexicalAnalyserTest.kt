package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.lexical.*
import com.heerkirov.hedge.server.library.compiler.lexical.CharSequence
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.LexicalError
import kotlin.test.Test
import kotlin.test.assertEquals

class LexicalAnalyserTest {
    @Test
    fun testSpace() {
        val analyzer = LexicalAnalyzer()
        //空串
        assertEquals(AnalysisResult(emptyList()), analyzer.parse(""))
        //测试各种空格
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 1))), analyzer.parse(" "))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 1))), analyzer.parse("\n"))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 1))), analyzer.parse("\r"))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 1))), analyzer.parse("\t"))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 2))), analyzer.parse("\n\r"))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 3))), analyzer.parse("\n \r"))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 3))), analyzer.parse(" \n "))
        assertEquals(AnalysisResult(listOf(spaceLexical(0, 4))), analyzer.parse(" \n\r\t"))
    }

    @Test
    fun testAllSymbolTypes() {
        val analyzer = LexicalAnalyzer()
        //对全符号表做一个单字符识别，保证每个单字符的识别类型是正确的
        assertEquals(AnalysisResult(listOf(symbolLexical("~", 0))), analyzer.parse("~"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.BACKTICKS, "", 0, 1)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('`', 1))),
            analyzer.parse("`"))
        assertEquals(AnalysisResult(emptyList(), warnings = listOf<LexicalError>(UselessSymbol('!', 0))),
            analyzer.parse("!"))
        assertEquals(AnalysisResult(listOf(symbolLexical("@", 0))), analyzer.parse("@"))
        assertEquals(AnalysisResult(listOf(symbolLexical("#", 0))), analyzer.parse("#"))
        assertEquals(AnalysisResult(listOf(symbolLexical("$", 0))), analyzer.parse("$"))
        assertEquals(AnalysisResult(emptyList(), warnings = listOf<LexicalError>(UselessSymbol('%', 0))),
            analyzer.parse("%"))
        assertEquals(AnalysisResult(listOf(symbolLexical("^", 0))), analyzer.parse("^"))
        assertEquals(AnalysisResult(listOf(symbolLexical("&", 0))), analyzer.parse("&"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "*", 0, 1))), analyzer.parse("*"))
        assertEquals(AnalysisResult(listOf(symbolLexical("(", 0))), analyzer.parse("("))
        assertEquals(AnalysisResult(listOf(symbolLexical(")", 0))), analyzer.parse(")"))
        assertEquals(AnalysisResult(listOf(symbolLexical("-", 0))), analyzer.parse("-"))
        assertEquals(AnalysisResult(emptyList(), warnings = listOf<LexicalError>(UselessSymbol('=', 0))),
            analyzer.parse("="))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1))), analyzer.parse("_"))
        assertEquals(AnalysisResult(listOf(symbolLexical("+", 0))), analyzer.parse("+"))
        assertEquals(AnalysisResult(listOf(symbolLexical("[", 0))), analyzer.parse("["))
        assertEquals(AnalysisResult(listOf(symbolLexical("]", 0))), analyzer.parse("]"))
        assertEquals(AnalysisResult(listOf(symbolLexical("{", 0))), analyzer.parse("{"))
        assertEquals(AnalysisResult(listOf(symbolLexical("}", 0))), analyzer.parse("}"))
        assertEquals(AnalysisResult(emptyList(), warnings = listOf<LexicalError>(UselessSymbol(';', 0))),
            analyzer.parse(";"))
        assertEquals(AnalysisResult(listOf(symbolLexical(":", 0))), analyzer.parse(":"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.APOSTROPHE, "", 0, 1)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('\'', 1))),
            analyzer.parse("'"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.DOUBLE_QUOTES, "", 0, 1)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('"', 1))),
            analyzer.parse("\""))
        assertEquals(AnalysisResult(listOf(symbolLexical(",", 0))), analyzer.parse(","))
        assertEquals(AnalysisResult(listOf(symbolLexical(".", 0))), analyzer.parse("."))
        assertEquals(AnalysisResult(listOf(symbolLexical("/", 0))), analyzer.parse("/"))
        assertEquals(AnalysisResult(emptyList(), warnings = listOf<LexicalError>(UselessSymbol('\\', 0))),
            analyzer.parse("\\"))
        assertEquals(AnalysisResult(listOf(symbolLexical("|", 0))), analyzer.parse("|"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "?", 0, 1))), analyzer.parse("?"))
        assertEquals(AnalysisResult(listOf(symbolLexical("<", 0))), analyzer.parse("<"))
        assertEquals(AnalysisResult(listOf(symbolLexical(">", 0))), analyzer.parse(">"))
    }

    @Test
    fun testSymbolTables() {
        val analyzer = LexicalAnalyzer()
        //测试符号表中的所有1位符号及其连写
        assertEquals(AnalysisResult(listOf(
            symbolLexical(":", 0),
            symbolLexical(">", 1),
            symbolLexical("<", 2),
            symbolLexical("~", 3),
            symbolLexical("|", 4),
            symbolLexical("/", 5),
            symbolLexical("&", 6),
            symbolLexical("-", 7),
            symbolLexical("+", 8),
            symbolLexical("@", 9),
            symbolLexical("#", 10),
            symbolLexical("$", 11),
            symbolLexical("^", 12),
            symbolLexical(".", 13),
            symbolLexical(",", 14),
            symbolLexical("[", 15),
            symbolLexical("]", 16),
            symbolLexical("(", 17),
            symbolLexical(")", 18),
            symbolLexical("{", 19),
            symbolLexical("}", 20),
        )), analyzer.parse(":><~|/&-+@#$^.,[](){}"))
        //测试符号表中的所有2位符号及其连写
        assertEquals(AnalysisResult(listOf(
            symbolLexical(">=", 0),
            symbolLexical("<=", 2),
            symbolLexical("~+", 4),
            symbolLexical("~-", 6),
        )), analyzer.parse(">=<=~+~-"))
    }

    @Test
    fun testString() {
        val analyzer = LexicalAnalyzer()
        //测试无限字符串
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.APOSTROPHE, "hello", 0, 7))), analyzer.parse("'hello'"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.DOUBLE_QUOTES, "こんにちは", 0, 7))), analyzer.parse("\"こんにちは\""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.BACKTICKS, "你好", 0, 4))), analyzer.parse("`你好`"))
        //测试无限字符串中间插入其他类型的字符串符号
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.APOSTROPHE, "a\"b", 0, 5))), analyzer.parse("'a\"b'"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.DOUBLE_QUOTES, "a`b", 0, 5))), analyzer.parse("\"a`b\""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.BACKTICKS, "a'b", 0, 5))), analyzer.parse("`a'b`"))
        //测试连续编写的无限字符串
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.APOSTROPHE, "a", 0, 3),
            stringLexical(CharSequenceType.DOUBLE_QUOTES, "b", 3, 6),
            stringLexical(CharSequenceType.BACKTICKS, "c", 6, 9),
            spaceLexical(9, 10),
            stringLexical(CharSequenceType.APOSTROPHE, "d", 10, 13),
            spaceLexical(13, 14),
            stringLexical(CharSequenceType.DOUBLE_QUOTES, "e", 14, 17),
            spaceLexical(17, 18),
            stringLexical(CharSequenceType.BACKTICKS, "f", 18, 21),
        )), analyzer.parse("""'a'"b"`c` 'd' "e" `f`"""))
        //测试不写字符串结束符
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.APOSTROPHE, "hello", 0, 6)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('\'', 6))),
            analyzer.parse("'hello"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.DOUBLE_QUOTES, "hello", 0, 6)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('"', 6))),
            analyzer.parse("\"hello"))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.BACKTICKS, "hello", 0, 6)), warnings = listOf<LexicalError>(ExpectQuoteButEOF('`', 6))),
            analyzer.parse("`hello"))
        //测试只写字符串结束符。这实际上变成了一个有限字符串+一个无终结的无限字符串的形式
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.RESTRICTED, "hello", 0, 5),
            stringLexical(CharSequenceType.APOSTROPHE, "", 5, 6),
        ), warnings = listOf<LexicalError>(ExpectQuoteButEOF('\'', 6))),
            analyzer.parse("hello'"))
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.RESTRICTED, "hello", 0, 5),
            stringLexical(CharSequenceType.DOUBLE_QUOTES, "", 5, 6),
        ), warnings = listOf<LexicalError>(ExpectQuoteButEOF('"', 6))),
            analyzer.parse("hello\""))
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.RESTRICTED, "hello", 0, 5),
            stringLexical(CharSequenceType.BACKTICKS, "", 5, 6),
        ), warnings = listOf<LexicalError>(ExpectQuoteButEOF('`', 6))),
            analyzer.parse("hello`"))
    }

    @Test
    fun testStringEscape() {
        val analyzer = LexicalAnalyzer()
        //测试无限字符串的转义
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.APOSTROPHE, "a'\"`\\\n\r\tb", 0, 18))), analyzer.parse("""'a\'\"\`\\\n\r\tb'"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.DOUBLE_QUOTES, "a'\"`\\\n\r\tb", 0, 18))), analyzer.parse(""""a\'\"\`\\\n\r\tb""""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.BACKTICKS, "a'\"`\\\n\r\tb", 0, 18))), analyzer.parse("""`a\'\"\`\\\n\r\tb`"""))
        //测试转义普通字符
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.APOSTROPHE, "?1c", 0, 8)
        ), warnings = listOf<LexicalError>(
            NormalCharacterEscaped('?', 2),
            NormalCharacterEscaped('1', 4),
            NormalCharacterEscaped('c', 6),
        )), analyzer.parse("""'\?\1\c'"""))
        //测试转义字符后接EOF
        assertEquals(AnalysisResult(listOf(
            LexicalItem(CharSequence(CharSequenceType.BACKTICKS, ""), 0, 2)
        ), warnings = listOf<LexicalError>(
            ExpectEscapedCharacterButEOF(2)
        )), analyzer.parse("""`\"""))
    }

    @Test
    fun testRestrictedString() {
        val analyzer = LexicalAnalyzer()
        //测试单个普通受限字符串
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "abc", 0, 3))), analyzer.parse("""abc"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "123", 0, 3))), analyzer.parse("""123"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "你好", 0, 2))), analyzer.parse("""你好"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "こんにちは", 0, 5))), analyzer.parse("""こんにちは"""))
        //测试空格分割的受限字符串
        assertEquals(AnalysisResult(listOf(
            stringLexical(CharSequenceType.RESTRICTED, "abc", 0, 3),
            spaceLexical(3, 4),
            stringLexical(CharSequenceType.RESTRICTED, "你好", 4, 6),
            spaceLexical(6, 7),
            stringLexical(CharSequenceType.RESTRICTED, "こんにちは", 7, 12),
        )), analyzer.parse("""abc 你好 こんにちは"""))
        //测试受限字符串中间可接受的符号
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_?*+-!", 0, 6))), analyzer.parse("""_?*+-!"""))
        //测试受限字符串中间不可接受的符号
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("~", 1))),
            analyzer.parse("""_~"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), stringLexical(CharSequenceType.BACKTICKS, "", 1, 2)),
            warnings = listOf<LexicalError>(ExpectQuoteButEOF('`', 2))),
            analyzer.parse("""_`"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("@", 1))),
            analyzer.parse("""_@"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("#", 1))),
            analyzer.parse("""_#"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("$", 1))),
            analyzer.parse("""_$"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1)), warnings = listOf<LexicalError>(UselessSymbol('%', 1))),
            analyzer.parse("""_%"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("^", 1))),
            analyzer.parse("""_^"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("&", 1))),
            analyzer.parse("""_&"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("(", 1))),
            analyzer.parse("""_("""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical(")", 1))),
            analyzer.parse("""_)"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1)), warnings = listOf<LexicalError>(UselessSymbol('=', 1))),
            analyzer.parse("""_="""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("[", 1))),
            analyzer.parse("""_["""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("]", 1))),
            analyzer.parse("""_]"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("{", 1))),
            analyzer.parse("""_{"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("}", 1))),
            analyzer.parse("""_}"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("|", 1))),
            analyzer.parse("""_|"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1)), warnings = listOf<LexicalError>(UselessSymbol('\\', 1))),
            analyzer.parse("""_\"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1)), warnings = listOf<LexicalError>(UselessSymbol(';', 1))),
            analyzer.parse("""_;"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical(":", 1))),
            analyzer.parse("""_:"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), stringLexical(CharSequenceType.APOSTROPHE, "", 1, 2)),
            warnings = listOf<LexicalError>(ExpectQuoteButEOF('\'', 2))),
            analyzer.parse("""_'"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), stringLexical(CharSequenceType.DOUBLE_QUOTES, "", 1, 2)),
            warnings = listOf<LexicalError>(ExpectQuoteButEOF('"', 2))),
            analyzer.parse("""_""""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical(",", 1))),
            analyzer.parse("""_,"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical(".", 1))),
            analyzer.parse("""_."""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("<", 1))),
            analyzer.parse("""_<"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical(">", 1))),
            analyzer.parse("""_>"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), symbolLexical("/", 1))),
            analyzer.parse("""_/"""))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), spaceLexical(1, 2))),
            analyzer.parse("""_ """))
        assertEquals(AnalysisResult(listOf(stringLexical(CharSequenceType.RESTRICTED, "_", 0, 1), spaceLexical(1, 2))),
            analyzer.parse("_\n"))
    }

    private fun spaceLexical(beginIndex: Int, endIndex: Int) = LexicalItem(Space, beginIndex, endIndex)

    private fun symbolLexical(symbol: String, beginIndex: Int) = LexicalItem(Symbol.of(symbol), beginIndex, beginIndex + symbol.length)

    private fun stringLexical(type: CharSequenceType, value: String, beginIndex: Int, endIndex: Int) = LexicalItem(CharSequence(type, value), beginIndex, endIndex)
}