package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.*
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Annotation
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Collection
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.GrammarError
import kotlin.test.Test
import kotlin.test.assertEquals

class GrammarAnalyzerTest {
    @Test
    fun testPredicative() {
        //最简单的element - strList
        assertEquals(AnalysisResult(semanticRootOf(0, 5,
            sequenceItemOf(0, 5, minus = false, source = false,
                elementOf(0, 5, null,
                    sfpOf(0, 5,
                        strListOf(0, 5, strOf("hello", Str.Type.RESTRICTED, 0, 5))
                    )
                )
            )
        )), parse("hello"))
        //基本主系表和串列表
        assertEquals(AnalysisResult(semanticRootOf(0, 13,
            sequenceItemOf(0, 13, minus = false, source = false,
                elementOf(0, 13, null,
                    sfpOf(0, 13,
                        strListOf(0, 5, strOf("a", Str.Type.RESTRICTED, 0, 1), strOf("b", Str.Type.DOUBLE_QUOTES, 2, 5)),
                        familyOf(5, 6, ":"),
                        strListOf(6, 13, strOf("b", Str.Type.APOSTROPHE, 6 , 9),  strOf("c", Str.Type.BACKTICKS, 10, 13))
                    )
                )
            )
        )), parse("a.\"b\":'b'.`c`"))
        //排序列表
        assertEquals(AnalysisResult(semanticRootOf(0, 14,
            sequenceItemOf(0, 14, minus = false, source = false,
                elementOf(0, 14, null,
                    sfpOf(0, 14,
                        strListOf(0, 5, strOf("order", Str.Type.RESTRICTED, 0, 5)),
                        familyOf(5, 6, ":"),
                        sortListOf(6, 14,
                            sortItemOf(6, 7, 0, false, strOf("a", Str.Type.RESTRICTED, 6, 7)),
                            sortItemOf(8, 10, -1, false, strOf("b", Str.Type.RESTRICTED, 9, 10)),
                            sortItemOf(11, 14, 1, true, strOf("c", Str.Type.RESTRICTED, 13, 14))
                        )
                    )
                )
            )
        )), parse("order:a,-b,+^c"))
        //只有一个项的排序列表
        assertEquals(AnalysisResult(semanticRootOf(0, 4,
            sequenceItemOf(0, 4, minus = false, source = false,
                elementOf(0, 4, null,
                    sfpOf(0, 4,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        sortListOf(2, 4,
                            sortItemOf(2, 4, 1, false, strOf("b", Str.Type.RESTRICTED, 3, 4))
                        )
                    )
                )
            )
        )), parse("a:+b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 5,
            sequenceItemOf(0, 5, minus = false, source = false,
                elementOf(0, 5, null,
                    sfpOf(0, 5,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        sortListOf(2, 5,
                            sortItemOf(2, 5, -1, true, strOf("b", Str.Type.RESTRICTED, 4, 5))
                        )
                    )
                )
            )
        )), parse("a:-^b"))
        //区间
        assertEquals(AnalysisResult(semanticRootOf(0, 7,
            sequenceItemOf(0, 7, minus = false, source = false,
                elementOf(0, 7, null,
                    sfpOf(0, 7,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        rangeOf(2, 7, strOf("1", Str.Type.RESTRICTED, 3, 4), strOf("2", Str.Type.RESTRICTED, 5, 6), includeFrom = true, includeTo = true)
                    )
                )
            )
        )), parse("a:[1,2]"))
        assertEquals(AnalysisResult(semanticRootOf(0, 7,
            sequenceItemOf(0, 7, minus = false, source = false,
                elementOf(0, 7, null,
                    sfpOf(0, 7,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        rangeOf(2, 7, strOf("1", Str.Type.RESTRICTED, 3, 4), strOf("2", Str.Type.RESTRICTED, 5, 6), includeTo = true)
                    )
                )
            )
        )), parse("a:(1,2]"))
        assertEquals(AnalysisResult(semanticRootOf(0, 7,
            sequenceItemOf(0, 7, minus = false, source = false,
                elementOf(0, 7, null,
                    sfpOf(0, 7,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        rangeOf(2, 7, strOf("1", Str.Type.RESTRICTED, 3, 4), strOf("2", Str.Type.RESTRICTED, 5, 6), includeFrom = true)
                    )
                )
            )
        )), parse("a:[1,2)"))
        assertEquals(AnalysisResult(semanticRootOf(0, 7,
            sequenceItemOf(0, 7, minus = false, source = false,
                elementOf(0, 7, null,
                    sfpOf(0, 7,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        rangeOf(2, 7, strOf("1", Str.Type.RESTRICTED, 3, 4), strOf("2", Str.Type.RESTRICTED, 5, 6))
                    )
                )
            )
        )), parse("a:(1,2)"))
        //集合
        assertEquals(AnalysisResult(semanticRootOf(0, 4,
            sequenceItemOf(0, 4, minus = false, source = false,
                elementOf(0, 4, null,
                    sfpOf(0, 4,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        collectionOf(2, 4)
                    )
                )
            )
        )), parse("a:{}"))
        assertEquals(AnalysisResult(semanticRootOf(0, 5,
            sequenceItemOf(0, 5, minus = false, source = false,
                elementOf(0, 5, null,
                    sfpOf(0, 5,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        collectionOf(2, 5,
                            strOf("x", Str.Type.RESTRICTED, 3, 4)
                        )
                    )
                )
            )
        )), parse("a:{x}"))
        assertEquals(AnalysisResult(semanticRootOf(0, 7,
            sequenceItemOf(0, 7, minus = false, source = false,
                elementOf(0, 7, null,
                    sfpOf(0, 7,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        collectionOf(2, 7,
                            strOf("x", Str.Type.RESTRICTED, 3, 4),
                            strOf("y", Str.Type.RESTRICTED, 5, 6),
                        )
                    )
                )
            )
        )), parse("a:{x,y}"))
        assertEquals(AnalysisResult(semanticRootOf(0, 11,
            sequenceItemOf(0, 11, minus = false, source = false,
                elementOf(0, 11, null,
                    sfpOf(0, 11,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        collectionOf(2, 11,
                            strOf("x", Str.Type.RESTRICTED, 3, 4),
                            strOf("y", Str.Type.RESTRICTED, 5, 6),
                            strOf("z", Str.Type.APOSTROPHE, 7, 10),
                        )
                    )
                )
            )
        )), parse("a:{x,y,'z'}"))
    }

    @Test
    fun testFamily() {
        //测试每种系语
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ":"),
                        strListOf(2, 3, strOf("b", Str.Type.RESTRICTED, 2, 3))
                    )
                )
            )
        )), parse("a:b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, "~"),
                        strListOf(2, 3, strOf("b", Str.Type.RESTRICTED, 2, 3))
                    )
                )
            )
        )), parse("a~b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, ">"),
                        strListOf(2, 3, strOf("b", Str.Type.RESTRICTED, 2, 3))
                    )
                )
            )
        )), parse("a>b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 2, "<"),
                        strListOf(2, 3, strOf("b", Str.Type.RESTRICTED, 2, 3))
                    )
                )
            )
        )), parse("a<b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 4,
            sequenceItemOf(0, 4, minus = false, source = false,
                elementOf(0, 4, null,
                    sfpOf(0, 4,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 3, ">="),
                        strListOf(3, 4, strOf("b", Str.Type.RESTRICTED, 3, 4))
                    )
                )
            )
        )), parse("a>=b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 4,
            sequenceItemOf(0, 4, minus = false, source = false,
                elementOf(0, 4, null,
                    sfpOf(0, 4,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 3, "<="),
                        strListOf(3, 4, strOf("b", Str.Type.RESTRICTED, 3, 4))
                    )
                )
            )
        )), parse("a<=b"))
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 3, "~+")
                    )
                )
            )
        )), parse("a~+"))
        assertEquals(AnalysisResult(semanticRootOf(0, 3,
            sequenceItemOf(0, 3, minus = false, source = false,
                elementOf(0, 3, null,
                    sfpOf(0, 3,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(1, 3, "~-")
                    )
                )
            )
        )), parse("a~-"))
    }

    @Test
    fun testSpace() {
        //测试消除的空格对index的影响
        assertEquals(AnalysisResult(semanticRootOf(0, 5,
            sequenceItemOf(0, 5, minus = false, source = false,
                elementOf(0, 5, null,
                    sfpOf(0, 5,
                        strListOf(0, 1, strOf("a", Str.Type.RESTRICTED, 0, 1)),
                        familyOf(2, 3, ":"),
                        strListOf(4, 5, strOf("b", Str.Type.RESTRICTED, 4, 5))
                    )
                )
            )
        )), parse("a : b"))
        assertEquals(AnalysisResult(semanticRootOf(1, 4,
            sequenceItemOf(1, 4, minus = false, source = false,
                elementOf(1, 4, null,
                    sfpOf(1, 4,
                        strListOf(1, 2, strOf("a", Str.Type.RESTRICTED, 1, 2)),
                        familyOf(2, 3, ":"),
                        strListOf(3, 4, strOf("b", Str.Type.RESTRICTED, 3, 4))
                    )
                )
            )
        )), parse(" a:b "))
    }

    private fun parse(text: String): AnalysisResult<SemanticRoot, GrammarError<*>> {
        val lexicalResult = LexicalAnalyzer.parse(text)
        return GrammarAnalyzer.parse(lexicalResult.result!!)
    }

    private fun semanticRootOf(beginIndex: Int, endIndex: Int, vararg items: SequenceItem) = SemanticRoot(items.toList(), beginIndex, endIndex)

    private fun sequenceItemOf(beginIndex: Int, endIndex: Int, minus: Boolean = false, source: Boolean = false, body: SequenceBody) = SequenceItem(minus, source, body, beginIndex, endIndex)

    private fun elementOf(beginIndex: Int, endIndex: Int, prefix: Symbol? = null, vararg items: SFP) = Element(prefix, items.toList(), beginIndex, endIndex)

    private fun annotationOf(beginIndex: Int, endIndex: Int, prefixes: List<Symbol> = emptyList(), vararg items: Str) = Annotation(prefixes, items.toList(), beginIndex, endIndex)

    private fun sfpOf(beginIndex: Int, endIndex: Int, subject: Subject, family: Family? = null, predicative: Predicative? = null) = SFP(subject, family, predicative, beginIndex, endIndex)

    private fun familyOf(beginIndex: Int, endIndex: Int, value: String) = Family(value, beginIndex, endIndex)

    private fun strListOf(beginIndex: Int, endIndex: Int, vararg items: Str) = StrListImpl(items.toMutableList(), beginIndex, endIndex)

    private fun collectionOf(beginIndex: Int, endIndex: Int, vararg items: Str) = Collection(items.toList(), beginIndex, endIndex)

    private fun rangeOf(beginIndex: Int, endIndex: Int, from: Str, to: Str, includeFrom: Boolean = false, includeTo: Boolean = false) = Range(from, to, includeFrom, includeTo, beginIndex, endIndex)

    private fun sortListOf(beginIndex: Int, endIndex: Int, vararg items: SortItem) = SortListImpl(items.toMutableList(), beginIndex, endIndex)

    private fun sortItemOf(beginIndex: Int, endIndex: Int, direction: Int, source: Boolean, value: Str) = SortItem(value, source, direction, beginIndex, endIndex)

    private fun strOf(value: String, type: Str.Type, beginIndex: Int, endIndex: Int) = Str(value, type, beginIndex, endIndex)

    private fun symbolOf(value: String, beginIndex: Int, endIndex: Int) = Symbol(value, beginIndex, endIndex)
}