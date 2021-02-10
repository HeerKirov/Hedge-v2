package com.heerkirov.hedge.server.library.compiler

import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.SemanticAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.framework.QueryDialect
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.Queryer
import com.heerkirov.hedge.server.library.compiler.translator.Translator
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import kotlin.reflect.KClass
import kotlin.test.Test

class TranslatorTest {
    @Test
    fun test() {

    }

    private fun parse(text: String, dialect: KClass<out QueryDialect<*>>, queryer: Queryer): AnalysisResult<VisualQueryPlan, TranslatorError<*>> {
        val (lexicalResult) = LexicalAnalyzer.parse(text)
        if(lexicalResult == null) {
            throw RuntimeException("lexical error.")
        }
        val (grammarResult) = GrammarAnalyzer.parse(lexicalResult)
        if(grammarResult == null) {
            throw RuntimeException("grammar error.")
        }
        val (semanticResult) = SemanticAnalyzer.parse(grammarResult, dialect)
        if(semanticResult == null) {
            throw RuntimeException("semantic error.")
        }
        return Translator.parse(semanticResult, queryer)
    }

    private class QueryerForTest() : Queryer {
        override fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag> {
            TODO("Not yet implemented")
        }

        override fun findTopic(metaValue: SimpleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTopic> {
            TODO("Not yet implemented")
        }

        override fun findAuthor(metaValue: SingleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementAuthor> {
            TODO("Not yet implemented")
        }

        override fun findAnnotation(metaString: MetaString, metaType: Set<MetaType>, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation> {
            TODO("Not yet implemented")
        }
    }
}