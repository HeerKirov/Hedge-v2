package com.heerkirov.hedge.server.library.compiler.lexical

import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.LexicalError
import java.util.*

/**
 * 词法分析器。执行Query语句 -> 词素列表的步骤。
 */
object LexicalAnalyzer {
    /**
     * 执行词法分析。
     * 返回的列表除词素外，还包括每个词素的出身位置，以及生成该词素的原始字符串，便于进行错误回溯。
     */
    fun parse(queryLanguage: String): AnalysisResult<List<LexicalItem>, LexicalError> {
        val collector = ErrorCollector<LexicalError>()
        val result = LinkedList<LexicalItem>()
        var index = 0
        while (index < queryLanguage.length) {
            val (morpheme, endIndex) = analyseSpace(queryLanguage, index)
                ?: analyseSymbol(queryLanguage, index)
                ?: analyseString(queryLanguage, index, collector)
                ?: analyseRestrictedString(queryLanguage, index)
            result.add(LexicalItem(morpheme, index, endIndex))
            index = endIndex
        }
        return AnalysisResult(result, collector.warnings, collector.errors)
    }

    private fun analyseSpace(text: String, beginIndex: Int): ParseItem? {
        if(text[beginIndex] in spaceSymbols) {
            for(i in (beginIndex + 1) until text.length) {
                if(text[i] !in spaceSymbols) {
                    return ParseItem(Space, i)
                }
            }
            return ParseItem(Space, text.length)
        }
        return null
    }

    private fun analyseSymbol(text: String, beginIndex: Int): ParseItem? {
        //符号的判断较为简单，因为符号只有1、2两种长度，且2长度的符号开头一定是1长度的符号
        //当取得的符号位于doubleSymbol映射表时，验证下一位符号是否存在，以及是否属于映射表
        val char = text[beginIndex]
        if (char in singleSymbols) {
            if(beginIndex + 1 < text.length) {
                val d = doubleSymbolsMap[char]
                if(d != null && text[beginIndex + 1] in d) {
                    return ParseItem(Symbol.of(text.substring(beginIndex, beginIndex + 2)), beginIndex + 2)
                }
            }
            return ParseItem(Symbol.of(char.toString()), beginIndex + 1)
        }
        return null
    }

    private fun analyseString(text: String, beginIndex: Int, collector: ErrorCollector<LexicalError>): ParseItem? {
        val quote = text[beginIndex]
        if(quote in stringSymbols) {
            //遇到一个字符串开始符号，视作一个无限字符串的开始。
            val builder = StringBuilder()

            var index = beginIndex + 1
            while(index < text.length) {
                when (val char = text[index]) {
                    quote -> {
                        //遇到匹配的字符串结束符号，结束这段字符串
                        return ParseItem(CharSequence(stringSymbols[quote]!!, builder.toString()), index + 1)
                    }
                    '\\' -> {
                        //遇到转义符号
                        if(++index >= text.length) {
                            //WARNING: 转义符号后接EOF，错误的符号预期
                            collector.warning(ExpectEscapedCharacterButEOF(index))
                            return ParseItem(CharSequence(stringSymbols[quote]!!, builder.toString()), index)
                        }
                        val originChar = text[index]
                        val escapeChar = escapeSymbols[originChar]
                        if(escapeChar == null) {
                            //WARNING: 转义了一个普通字符
                            collector.warning(NormalCharacterEscaped(originChar, index))
                            builder.append(originChar)
                        }else{
                            builder.append(escapeChar)
                        }
                    }
                    else -> builder.append(char)
                }
                index += 1
            }
            //WARNING: 遇到了EOF，而没有遇到字符串终结符，错误的符号预期
            collector.warning(ExpectQuoteButEOF(quote, text.length))
            return ParseItem(CharSequence(stringSymbols[quote]!!, builder.toString()), text.length)
        }
        return null
    }

    private fun analyseRestrictedString(text: String, beginIndex: Int): ParseItem {
        for(index in beginIndex until text.length) {
            val char = text[index]
            if(char in spaceSymbols || char in restrictedSymbols) {
                //遇到空格、受限符号表时，有限字符串结束
                return ParseItem(CharSequence(CharSequenceType.RESTRICTED, text.substring(beginIndex, index)), index)
            }
            //其他任何符号，包括字符串符号、转义符号，都被视作受限字符串的合法的一部分
        }
        //遇到EOF，有限字符串结束
        return ParseItem(CharSequence(CharSequenceType.RESTRICTED, text.substring(beginIndex)), text.length)
    }

    private data class ParseItem(val morpheme: Morpheme, val endIndex: Int)
}