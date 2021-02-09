package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.SemanticAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AlbumDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AnnotationDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AuthorAndTopicDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.IllustDialect
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.BlankElement
import com.heerkirov.hedge.server.library.compiler.translator.Queryer
import com.heerkirov.hedge.server.library.compiler.translator.Translator
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.CompileError
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.utils.ktorm.contains
import me.liuwj.ktorm.dsl.*

class QueryManager(private val data: DataRepository) {
    private val queryer = QueryerImpl()

    fun querySchema(text: String, dialect: Dialect): AnalysisResult<VisualQueryPlan, CompileError<*>> {
        val lexicalResult = LexicalAnalyzer.parse(text)
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
        val translatorResult = Translator.parse(semanticResult.result, queryer)
        if(translatorResult.result == null) {
            return AnalysisResult(null, warnings = translatorResult.warnings, errors = translatorResult.errors)
        }

        return AnalysisResult(translatorResult.result, warnings = lexicalResult.warnings + grammarResult.warnings + semanticResult.warnings + translatorResult.warnings)
    }

    enum class Dialect { ILLUST, ALBUM, AUTHOR_AND_TOPIC, ANNOTATION }

    //TODO 面向db的查询有数量上限和警告数量设定
    //TODO 尽力缓存一切可能缓存的东西
    private inner class QueryerImpl : Queryer {
        override fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag> {
            TODO("Not yet implemented")
        }

        override fun findTopic(metaValue: SimpleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTopic> {
            TODO("Not yet implemented")
        }

        override fun findAuthor(metaValue: SingleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementAuthor> {
            TODO("Not yet implemented")
        }

        override fun findAnnotation(metaString: MetaString, metaType: Set<AnnotationElement.MetaType>, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation> {
            if(metaString.value.isBlank()) {
                collector.warning(BlankElement())
                return emptyList()
            }
            return data.db.from(Annotations).select(Annotations.id, Annotations.name)
                .whereWithConditions {
                    it += if(metaString.precise) Annotations.name eq metaString.value else Annotations.name like "%${metaString.value}%"
                    if(metaType.isNotEmpty()) { it += Annotations.target contains mapMetaTypeToTarget(metaType) }
                }
                .map { ElementAnnotation(it[Annotations.id]!!, it[Annotations.name]!!) }
        }

        private fun mapMetaTypeToTarget(metaTypes: Set<AnnotationElement.MetaType>): Annotation.AnnotationTarget {
            var target: Annotation.AnnotationTarget = Annotation.AnnotationTarget.empty
            for (metaType in metaTypes) {
                when (metaType) {
                    AnnotationElement.MetaType.Tag -> target += Annotation.AnnotationTarget.TAG
                    AnnotationElement.MetaType.Topic -> target += Annotation.AnnotationTarget.TOPIC
                    AnnotationElement.MetaType.Author -> target += Annotation.AnnotationTarget.AUTHOR
                }
            }
            return target
        }
    }
}