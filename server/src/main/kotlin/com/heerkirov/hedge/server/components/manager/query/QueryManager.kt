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
import com.heerkirov.hedge.server.library.compiler.utils.CompileError
import java.util.concurrent.ConcurrentHashMap

class QueryManager(private val data: DataRepository) {
    private val queryer = MetaQueryer(data)
    private val options = OptionsImpl()

    private val executePlanCache = ConcurrentHashMap<DialectAndText, QuerySchema>()

    fun querySchema(text: String, dialect: Dialect): QuerySchema {
        return executePlanCache.computeIfAbsent(DialectAndText(dialect, text)) { key ->
            val lexicalResult = LexicalAnalyzer.parse(key.text, options)
            if(lexicalResult.result == null) {
                return@computeIfAbsent QuerySchema(null, null, warnings = lexicalResult.warnings, errors = lexicalResult.errors)
            }
            val grammarResult = GrammarAnalyzer.parse(lexicalResult.result)
            if(grammarResult.result == null) {
                return@computeIfAbsent QuerySchema(null, null, warnings = lexicalResult.warnings + grammarResult.warnings, errors = grammarResult.errors)
            }
            val semanticResult = SemanticAnalyzer.parse(grammarResult.result, when (key.dialect) {
                Dialect.ILLUST -> IllustDialect::class
                Dialect.ALBUM -> AlbumDialect::class
                Dialect.AUTHOR_AND_TOPIC -> AuthorAndTopicDialect::class
                Dialect.ANNOTATION -> AnnotationDialect::class
            })
            if(semanticResult.result == null) {
                return@computeIfAbsent QuerySchema(null, null, warnings = unionList(lexicalResult.warnings, grammarResult.warnings, semanticResult.warnings), errors = grammarResult.errors)
            }
            val builder = when (key.dialect) {
                Dialect.ILLUST -> IllustExecutePlanBuilder(data.db)
                else -> TODO("Not yet implemented")
            }
            val translatorResult = Translator.parse(semanticResult.result, queryer, builder, options)

            if(translatorResult.result == null) {
                QuerySchema(null, null, warnings = unionList(lexicalResult.warnings, grammarResult.warnings, semanticResult.warnings, translatorResult.warnings), errors = translatorResult.errors)
            }else{
                QuerySchema(translatorResult.result, builder.build(), warnings = unionList(lexicalResult.warnings, grammarResult.warnings, semanticResult.warnings, translatorResult.warnings), errors = emptyList())
            }
        }
    }

    private fun <T> unionList(vararg list: List<T>): List<T> {
        val result = ArrayList<T>(list.sumBy { it.size })
        for (i in list) {
            result.addAll(i)
        }
        return result
    }

    enum class Dialect { ILLUST, ALBUM, AUTHOR_AND_TOPIC, ANNOTATION }

    private data class DialectAndText(val dialect: Dialect, val text: String)

    data class QuerySchema(val visualQueryPlan: VisualQueryPlan?, val executePlan: ExecutePlan?, val warnings: List<CompileError<*>>, val errors: List<CompileError<*>>)

    private inner class OptionsImpl : LexicalOptions, TranslatorOptions {
        private var _translateUnderscoreToSpace: Boolean? = null
        private var _chineseSymbolReflect: Boolean? = null
        private var _warningLimitOfUnionItems: Int? = null
        private var _warningLimitOfIntersectItems: Int? = null

        override val translateUnderscoreToSpace: Boolean get() {
            if (data.metadata.query.translateUnderscoreToSpace != _translateUnderscoreToSpace) {
                _translateUnderscoreToSpace = data.metadata.query.translateUnderscoreToSpace
                if(executePlanCache.isNotEmpty()) executePlanCache.clear()
            }
            return _translateUnderscoreToSpace!!
        }
        override val chineseSymbolReflect: Boolean get() {
            if (data.metadata.query.chineseSymbolReflect != _chineseSymbolReflect) {
                _chineseSymbolReflect = data.metadata.query.chineseSymbolReflect
                if(executePlanCache.isNotEmpty()) executePlanCache.clear()
            }
            return _chineseSymbolReflect!!
        }
        override val warningLimitOfUnionItems: Int get() {
            if (data.metadata.query.warningLimitOfUnionItems != _warningLimitOfUnionItems) {
                _warningLimitOfUnionItems = data.metadata.query.warningLimitOfUnionItems
                if(executePlanCache.isNotEmpty()) executePlanCache.clear()
            }
            return _warningLimitOfUnionItems!!
        }
        override val warningLimitOfIntersectItems: Int get() {
            if (data.metadata.query.warningLimitOfIntersectItems != _warningLimitOfIntersectItems) {
                _warningLimitOfIntersectItems = data.metadata.query.warningLimitOfIntersectItems
                if(executePlanCache.isNotEmpty()) executePlanCache.clear()
            }
            return _warningLimitOfIntersectItems!!
        }
    }
}