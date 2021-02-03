package com.heerkirov.hedge.server.library.compiler.semantic

import com.heerkirov.hedge.server.library.compiler.grammar.semantic.*
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Annotation as SemanticAnnotation
import com.heerkirov.hedge.server.library.compiler.grammar.semantic.Element as SemanticElement
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.*
import com.heerkirov.hedge.server.library.compiler.semantic.framework.*
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.semantic.utils.ThrowsSemanticError
import com.heerkirov.hedge.server.library.compiler.semantic.utils.aliasToString
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.SemanticError
import kotlin.reflect.KClass
import kotlin.reflect.full.memberProperties

/**
 * 语义分析。执行语义树 -> 查询计划的步骤。
 */
object SemanticAnalyzer {
    private val dialects = arrayOf(IllustDialect, AlbumDialect, TopicDialect, AuthorDialect, AnnotationDialect).map { it::class to DialectStructure(it) }.toMap()
    private val allIdentifies = emptySet<String>()

    /**
     * 执行语义分析。
     */
    fun parse(root: SemanticRoot, dialectClazz: KClass<QueryDialect<*>>): AnalysisResult<QueryPlan, SemanticError<*>> {
        val dialect = dialects[dialectClazz] ?: throw RuntimeException("Unregister dialect ${dialectClazz.simpleName}.")
        val collector = ErrorCollector<SemanticError<*>>()
        val elements = mutableListOf<Element<*>>()
        val filters = mutableListOf<UnionFilters>()
        val orders = mutableListOf<Order<*>>()
        //遍历整个root
        for (sequenceItem in root.items) {
            //每个sequenceItem是一个合取项
            when (sequenceItem.body) {
                is SemanticElement -> {
                    //构造一个列表，列表的每一项标记对应索引的item是否是关键字项目
                    val whetherIsIdentifies = sequenceItem.body.items.map { whetherIsIdentifyAndMapToAlias(it.subject, sequenceItem.body.prefix, sequenceItem.source) }
                    when {
                        whetherIsIdentifies.all { it != null } -> {
                            //所有的项都是关键字项目，进入关键字处理流程
                            if(whetherIsIdentifies.any { it == "order" }) {
                                //存在order项，进入order处理流程
                                if(whetherIsIdentifies.size != 1) TODO("ERROR: order项不能与其他项使用或连接")
                                if(sequenceItem.minus) TODO("ERROR: order项不能被排除")
                                if(sequenceItem.source) TODO("ERROR: order项不能带有源标记")
                                val (subject, family, predicative) = sequenceItem.body.items.first()
                                try {
                                    val result = dialect.orderGenerator.generate(subject as StrList, family, predicative)
                                    orders.addAll(result)
                                }catch (e: ThrowsSemanticError) {
                                    e.errors.forEach { collector.error(it) }
                                }
                            }else{
                                //否则按普通关键字项目处理
                                val subFilters = mutableListOf<Filter<*>>()
                                whetherIsIdentifies.zip(sequenceItem.body.items).forEachIndexed { index, (alias, sfp) ->
                                    val generator = dialect.identifyGenerators[alias] ?: TODO("ERROR: 当前方言不支持此关键字alias")
                                    val (subject, family, predicative) = sfp
                                    try {
                                        if(generator is GeneratedSequenceByIdentify<*>) {
                                            @Suppress("UNCHECKED_CAST")
                                            val results = (generator as GeneratedSequenceByIdentify<Filter<*>>).generateSeq(subject as StrList, family, predicative)
                                            subFilters.addAll(results)
                                        }else{
                                            val result = generator.generate(subject as StrList, family, predicative)
                                            subFilters.add(result)
                                        }
                                    }catch (e: ThrowsSemanticError) {
                                        e.errors.forEach { collector.error(it) }
                                    }
                                }
                                val finalSubFilters = subFilters.groupBy { it.field }.map { (field, filters) -> if(filters.size > 1 && field is GeneratedByIdentify<*>) @Suppress("UNCHECKED_CAST") (field as GeneratedByIdentify<Filter<*>>).merge(filters) else filters }.flatten()
                                filters.add(UnionFilters(finalSubFilters, sequenceItem.minus))
                            }
                        }
                        whetherIsIdentifies.all { it == null } -> {
                            //所有的项都不是关键字项目，进入元素处理流程
                            val generator = if(sequenceItem.source) dialect.sourceElementGenerator else dialect.elementGenerator
                            try {
                                val result = generator.generate(sequenceItem.body, sequenceItem.minus)
                                elements.add(result)
                            }catch (e: ThrowsSemanticError) {
                                e.errors.forEach { collector.error(it) }
                            }
                        }
                        else -> TODO("ERROR: 不允许在一个合取项中混写关键字项目和元素")
                    }
                }
                is SemanticAnnotation -> {
                    //项是注解元素
                    if(sequenceItem.source) TODO("annotation不能带有源标记")
                    try {
                        val result = dialect.annotationElementGenerator.generate(sequenceItem.body, sequenceItem.minus)
                        elements.add(result)
                    }catch (e: ThrowsSemanticError) {
                        e.errors.forEach { collector.error(it) }
                    }
                }
            }
        }

        return AnalysisResult(if(collector.hasErrors) null else QueryPlan(orders, filters, elements), warnings = collector.warnings, errors = collector.errors)
    }

    /**
     * 根据目标Subject判断目标SFP是否符合一个关键字项目的定义。如果是，返回这个关键字的alias，否则返回null。
     */
    private fun whetherIsIdentifyAndMapToAlias(subject: Subject, prefix: Symbol?, sourceFlag: Boolean): String? {
        if(subject !is StrList) throw RuntimeException("Unsupported subject type ${subject::class.simpleName}.")
        if(prefix == null && subject.items.size == 1 && subject.items.first().type == Str.Type.RESTRICTED) {
            val alias = aliasToString(subject.items.first().value, sourceFlag).toLowerCase()
            if(alias == "order" || alias in allIdentifies) {
                //只要在全部关键字列表中发现此项，就判定为关键字。后面遇到不是当前方言的关键字时，会抛错误。
                return alias
            }
        }
        return null
    }

    /**
     * 方言构造。build一种方言的快速查询器。
     */
    private class DialectStructure<O : Enum<O>>(dialect: QueryDialect<O>) {
        /**
         * 此方言对元素的生成方案。
         */
        val elementGenerator: ElementFieldByElement

        /**
         * 此方言对source标记的元素的生成方案。
         */
        val sourceElementGenerator: ElementFieldByElement

        /**
         * 此方言对annotation类型元素的生成方案。
         */
        val annotationElementGenerator: ElementFieldByAnnotation

        /**
         * 此方言对identify的生成方案。
         */
        val identifyGenerators: Map<String, FilterFieldByIdentify<*>>

        /**
         * 此方言对order的生成方案。
         */
        val orderGenerator: OrderFieldByIdentify<O>

        init {
            this.orderGenerator = dialect.order.cast()
            this.elementGenerator = dialect.elements.asSequence().filterIsInstance<ElementFieldByElement>().firstOrNull() ?: DefaultElementField
            this.sourceElementGenerator = dialect.elements.asSequence().filterIsInstance<ElementFieldByElement>().firstOrNull() ?: DefaultSourceElementField
            this.annotationElementGenerator = dialect.elements.asSequence().filterIsInstance<ElementFieldByAnnotation>().firstOrNull() ?: DefaultAnnotationElementField
            this.identifyGenerators = dialect::class.memberProperties.asSequence()
                .filter { it.name != "order" && it.name != "elements" }
                .filter { !it.returnType.isMarkedNullable && it.returnType.classifier == FilterFieldDefinition::class }
                .map { it.call(dialect) as FilterFieldDefinition<*> }
                .map { it.cast<FilterFieldDefinition<*>, FilterFieldByIdentify<*>>() }
                .flatMap { it.alias.asSequence().map { alias -> alias.toLowerCase() to it } }
                .toMap()
        }

        private inline fun <T : Any, reified R : T> T.cast(): R {
            return if(this is R) this else throw ClassCastException("${this::class.simpleName} cannot be cast to ${R::class.simpleName}.")
        }
    }

    /**
     * 如果方言没有定义对元素的生成方案的默认值。
     */
    object DefaultElementField : ElementFieldByElement() {
        override val itemName = "unknown"
        override val forSourceFlag = false
        override fun generate(element: SemanticElement, minus: Boolean) = TODO("ERROR: 不支持使用元素定义")
    }

    /**
     * 如果方言没有定义对source元素的生成方案的默认值。
     */
    object DefaultSourceElementField : ElementFieldByElement() {
        override val itemName = "unknown"
        override val forSourceFlag = false
        override fun generate(element: SemanticElement, minus: Boolean) = TODO("ERROR: 不支持使用source符号的元素定义")
    }

    /**
     * 如果方言没有定义对注解元素的生成方案的默认值。
     */
    object DefaultAnnotationElementField : ElementFieldByAnnotation() {
        override val itemName = "unknown"
        override fun generate(annotation: SemanticAnnotation, minus: Boolean) = TODO("ERROR: 不支持使用注解元素定义")
    }
}