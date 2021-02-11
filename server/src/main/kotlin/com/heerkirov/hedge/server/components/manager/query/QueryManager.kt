package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalOptions
import com.heerkirov.hedge.server.library.compiler.semantic.SemanticAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AlbumDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AnnotationDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AuthorAndTopicDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.IllustDialect
import com.heerkirov.hedge.server.library.compiler.translator.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.CompileError

class QueryManager(private val data: DataRepository) {
    private val queryer = MetaQueryer(data)
    private val options = OptionsImpl()

    fun querySchema(text: String, dialect: Dialect): AnalysisResult<VisualQueryPlan, CompileError<*>> {
        val lexicalResult = LexicalAnalyzer.parse(text, options)
        if(lexicalResult.result == null) {
            return AnalysisResult(null, warnings = lexicalResult.warnings, errors = lexicalResult.errors)
        }
        val grammarResult = GrammarAnalyzer.parse(lexicalResult.result)
        if(grammarResult.result == null) {
            return AnalysisResult(null, warnings = grammarResult.warnings, errors = grammarResult.errors)
        }
        val semanticResult = SemanticAnalyzer.parse(grammarResult.result, when (dialect) {
            Dialect.ILLUST -> IllustDialect::class
            Dialect.ALBUM -> AlbumDialect::class
            Dialect.AUTHOR_AND_TOPIC -> AuthorAndTopicDialect::class
            Dialect.ANNOTATION -> AnnotationDialect::class
        })
        if(semanticResult.result == null) {
            return AnalysisResult(null, warnings = semanticResult.warnings, errors = semanticResult.errors)
        }
        val translatorResult = Translator.parse(semanticResult.result, queryer, options)
        if(translatorResult.result == null) {
            return AnalysisResult(null, warnings = translatorResult.warnings, errors = translatorResult.errors)
        }

        return AnalysisResult(translatorResult.result, warnings = lexicalResult.warnings + grammarResult.warnings + semanticResult.warnings + translatorResult.warnings)
    }

    enum class Dialect { ILLUST, ALBUM, AUTHOR_AND_TOPIC, ANNOTATION }

    private inner class OptionsImpl : LexicalOptions, TranslatorOptions {
        private val queryOptions by lazy { data.metadata.query }

        override val translateUnderscoreToSpace: Boolean get() = queryOptions.translateUnderscoreToSpace
        override val chineseSymbolReflect: Boolean get() = queryOptions.chineseSymbolReflect
        override val warningLimitOfUnionItems: Int get() = queryOptions.warningLimitOfUnionItems
        override val warningLimitOfIntersectItems: Int get() = queryOptions.warningLimitOfIntersectItems
    }
}