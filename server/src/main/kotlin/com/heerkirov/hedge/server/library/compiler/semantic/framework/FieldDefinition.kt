package com.heerkirov.hedge.server.library.compiler.semantic.framework

import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Annotation
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Element
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Family
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Predicative
import com.heerkirov.hedge.server.library.compiler.semantic.plan.Filter
import com.heerkirov.hedge.server.library.compiler.semantic.plan.FilterValue
import com.heerkirov.hedge.server.library.compiler.semantic.plan.JoinFilter
import com.heerkirov.hedge.server.library.compiler.semantic.plan.UnionFilters


/**
 * 此filter/join从一个关键字指示的特定项生成。
 */
interface GeneratedByIdentify<R : Any> {
    /**
     * 指示此生成器的关键字别名。
     */
    val alias: Array<out String>

    /**
     * 从此关键字指示的SFP生成结果。
     */
    fun generate(name: String, family: Family?, predicative: Predicative?): R

    /**
     * 同一个合取式中存在多个相同关键字的结果时，调用此方法尝试合并。
     */
    fun merge(group: List<R>): List<R> = group
}

/**
 * 此filter/join从一个普通元素生成。
 */
interface GeneratedByElement<R : Any> {
    /**
     * 此生成器对sourceFlag标记的元素是否接受。true表示接受没有sourceFlag标记的项，false表示接受有sourceFlag标记的项。
     */
    val forSourceFlag: Boolean
    /**
     * 从一整个元素构造结果。
     */
    fun generate(element: Element, minus: Boolean): R
}

/**
 * 此join从一个注解元素生成。
 */
interface GeneratedByAnnotation<R : Any> {
    /**
     * 此生成器对sourceFlag标记的元素是否接受。true表示接受没有sourceFlag标记的项，false表示接受有sourceFlag标记的项。
     */
    val forSourceFlag: Boolean
    /**
     * 从一整个注解构造结果。
     */
    fun generate(annotation: Annotation, minus: Boolean): R
}

/**
 * 扩展从关键字指示的项生成，生成多个项。
 */
interface GeneratedSequenceByIdentify<R : Any> : GeneratedByIdentify<R> {
    override fun generate(name: String, family: Family?, predicative: Predicative?): R = throw UnsupportedOperationException()

    /**
     * 从此关键字指示的SFP生成多个结果。
     */
    fun generateSeq(name: String, family: Family?, predicative: Predicative?): Sequence<R>
}


/**
 * filter的目标属性定义。
 */
interface FilterFieldDefinition<V : FilterValue> {
    val key: String
}

/**
 * join的生成器定义。
 */
interface JoinFieldDefinition


/**
 * 从关键字指示的项生成Filter。
 */
abstract class FilterFieldByIdentify<V : FilterValue> : FilterFieldDefinition<V>, GeneratedByIdentify<Filter<V>>

/**
 * 用普通元素项生成Filter。
 */
abstract class FilterFieldByElement<V : FilterValue> : FilterFieldDefinition<V>, GeneratedByElement<UnionFilters>

/**
 * 用普通元素生成JoinFilter。
 */
abstract class JoinFieldByElement : JoinFieldDefinition, GeneratedByElement<JoinFilter<*>>

/**
 * 用注解元素生成JoinFilter。
 */
abstract class JoinFieldByAnnotation : JoinFieldDefinition, GeneratedByAnnotation<JoinFilter<*>>


