package com.heerkirov.hedge.server.library.compiler.translator

import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.Element
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import kotlin.collections.ArrayList

/**
 * 执行计划翻译器。执行查询计划 -> 执行计划 & 可视化查询计划的过程。
 */
object Translator {
    /**
     * 执行翻译。
     * @param queryPlan 输入参数，查询计划。
     */
    fun parse(queryPlan: QueryPlan, queryer: Queryer, options: TranslatorOptions? = null): AnalysisResult<VisualQueryPlan, TranslatorError<*>> {
        val collector = ErrorCollector<TranslatorError<*>>()

        val visualOrderList = ArrayList<String>(queryPlan.orders.size)
        val visualFilters = ArrayList<FilterItem>(queryPlan.filters.size)
        val visualElements = ArrayList<Element<*>>()

        //翻译order部分
        queryPlan.orders.mapTo(visualOrderList, ::mapOrderItem)

        //翻译filter部分
        queryPlan.filters.mapTo(visualFilters) { unionFilters ->
            FilterItem(exclude = unionFilters.exclude, fields = unionFilters.groupBy { it.field }.map { (field, filters) ->
                FilterOfOneField(field.key, filters.flatMap { filter ->
                    when (filter) {
                        is EqualFilter -> (filter as EqualFilter<*>).values.map { FilterEqual(it.equalValue) }
                        is MatchFilter -> (filter as MatchFilter<*>).values.map { FilterMatch(it.matchValue) }
                        is RangeFilter -> (filter as RangeFilter<*>).let { listOf(FilterRange(it.begin?.compareValue, it.end?.compareValue, it.includeBegin, it.includeEnd)) }
                        is FlagFilter -> emptyList()
                        else -> throw RuntimeException("Unsupported filter type ${filter::class.simpleName}.")
                    }
                })
            })
        }

        //翻译element部分
        var joinDepth = 0
        queryPlan.elements.groupBy {
            when (it) {
                is NameElement -> "name"
                is AnnotationElement -> "annotation"
                is TagElement -> "meta-tag"
                is SourceTagElement -> "source-tag"
                else -> throw RuntimeException("Unsupported element type ${it::class.simpleName}.")
            }
        }.mapTo(visualElements) { (type, elements) ->
            Element(type, elements.map { element ->
                ElementItem(element.exclude, when (element) {
                    is NameElement -> element.items.map { ElementString(it.value, it.precise) }
                    is SourceTagElement -> element.items.map { ElementString(it.value, it.precise) }
                    is AnnotationElement -> mapAnnotationElement(element, queryer, collector, options).also { joinDepth += 1 }
                    is TagElement -> mapTagElement(element, queryer, collector, options).also { joinDepth += 1 }
                    else -> throw RuntimeException("Unsupported element type $type.")
                })
            })
        }
        if(options != null && joinDepth >= options.warningLimitOfIntersectItems) collector.warning(NumberOfIntersectItemExceed(options.warningLimitOfIntersectItems))

        return if(collector.hasErrors) {
            AnalysisResult(null, warnings = collector.warnings, errors = collector.errors)
        }else{
            AnalysisResult(VisualQueryPlan(visualOrderList, visualElements, visualFilters), warnings = collector.warnings)
        }
    }

    /**
     * 处理一个AnnotationElement的翻译。
     */
    private fun mapAnnotationElement(element: AnnotationElement, queryer: Queryer, collector: ErrorCollector<TranslatorError<*>>, options: TranslatorOptions?): List<ElementAnnotation> {
        return element.items.flatMap { queryer.findAnnotation(it, element.metaType, collector) }.also { result ->
            if(result.isEmpty()) collector.warning(WholeElementMatchesNone(element.items.map { it.revertToQueryString() }))
            else if(options!= null && result.size >= options.warningLimitOfUnionItems) collector.warning(NumberOfUnionItemExceed(element.items.map { it.revertToQueryString() }, options.warningLimitOfUnionItems))
        }
    }

    /**
     * 处理一个TagElement的翻译。
     */
    private fun mapTagElement(element: TagElement<*>, queryer: Queryer, collector: ErrorCollector<TranslatorError<*>>, options: TranslatorOptions?): List<ElementMeta> {
        return (if(element.metaType == null) {
            //未标记类型时，按tag->topic->author的顺序，依次进行搜索。由于整个合取项的类型统一，一旦某种类型找到了至少1个结果，就从这个类型返回
            val tagCollector = ErrorCollector<TranslatorError<*>>()
            val tagResult = element.items.flatMap { queryer.findTag(it, tagCollector) }
            if(tagResult.isNotEmpty() || element !is TopicElement<*>) {
                collector.collect(tagCollector)
                tagResult
            }else{
                val topicCollector = ErrorCollector<TranslatorError<*>>()
                val topicResult = element.items.flatMap { queryer.findTopic(it, topicCollector) }
                if(topicResult.isNotEmpty() || element !is AuthorElement) {
                    collector.collect(topicCollector)
                    topicResult
                }else{
                    val authorCollector = ErrorCollector<TranslatorError<*>>()
                    val authorResult = element.items.flatMap { queryer.findAuthor(it, authorCollector) }
                    collector.collect(authorCollector)
                    authorResult
                }
            }
        }else when (element.metaType) {
            //标记了类型时，按author->topic->tag的顺序，确定实际的类型是什么，然后根据单一类型确定查询结果
            MetaType.AUTHOR -> (element as AuthorElement).items.flatMap { queryer.findAuthor(it, collector) }
            MetaType.TOPIC -> (element as TopicElement<*>).items.flatMap { queryer.findTopic(it, collector) }
            MetaType.TAG -> element.items.flatMap { queryer.findTag(it, collector) }
        }).also { result ->
            if(result.isEmpty()) collector.warning(WholeElementMatchesNone(element.items.map { it.revertToQueryString() }))
            else if(options!= null && result.size >= options.warningLimitOfUnionItems) collector.warning(NumberOfUnionItemExceed(element.items.map { it.revertToQueryString() }, options.warningLimitOfUnionItems))
        }
    }

    /**
     * 将一个semantic order项翻译为可视化项。
     */
    private fun mapOrderItem(order: Order<*>): String {
        return "${if(order.isAscending()) "+" else "-"}${order.value}"
    }

    data class TranslatorResult<T : Any>(val visualQueryPlan: VisualQueryPlan, val executorPlan: T)
}