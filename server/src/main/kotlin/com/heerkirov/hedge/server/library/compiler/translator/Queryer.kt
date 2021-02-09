package com.heerkirov.hedge.server.library.compiler.translator

import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAnnotation
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementAuthor
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTag
import com.heerkirov.hedge.server.library.compiler.translator.visual.ElementTopic
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError

/**
 * 预查询翻译器接口。
 */
interface Queryer {
    fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag>

    fun findTopic(metaValue: SimpleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTopic>

    fun findAuthor(metaValue: SingleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementAuthor>

    fun findAnnotation(metaString: MetaString, metaType: Set<AnnotationElement.MetaType>, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation>
}