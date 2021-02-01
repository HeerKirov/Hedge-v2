package com.heerkirov.hedge.server.library.compiler.semantic.framework

import com.heerkirov.hedge.server.library.compiler.grammar.semantic.*
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*

/**
 * 对关键字项进行标准解析的field。处理等价和集合运算。使用组合解析器指定对str的解析策略。
 */
class EquableField<V>(override val key: String, override val alias: Array<out String>, private val strTypeParser: StrTypeParser<V>) : FilterFieldByIdentify<V>() where V: EquableValue<*> {
    override fun generate(name: String, family: Family?, predicative: Predicative?): EqualFilter<V> {
        if(family == null || predicative == null) TODO("ERROR: 缺少关系和值")

        return when (family.value) {
            ":" -> when(predicative) {
                is StrList -> processStrList(predicative)
                is Col -> processCol(predicative)
                is Range -> TODO("ERROR: 此处不支持区间")
                is SortList -> TODO("ERROR: 此处不支持排序列表")
                else -> throw RuntimeException("Unsupported predicative ${predicative::class.simpleName}.")
            }
            ">", "<", ">=", "<=" -> TODO("ERROR: 此处不支持比较运算")
            "~", "~+", "~-" -> TODO("ERROR: 不支持这几种关系符号")
            else -> throw RuntimeException("Unsupported family symbol '${family.value}'.")
        }
    }

    private fun processStrList(strList: StrList): EqualFilter<V> {
        if(strList.items.size > 1) TODO("ERROR: 关键字项的值不能使用标签地址段")
        val filterValue = strTypeParser.parse(strList.items.first().value)
        return EqualFilter(this, listOf(filterValue))
    }

    private fun processCol(col: Col): EqualFilter<V> {
        val filterValues = col.items.asSequence().map { strTypeParser.parse(it.value) }.toList()
        return EqualFilter(this, filterValues)
    }
}

/**
 * 对关键字项进行标准解析的field。处理等价和集合运算，以及区间和比较运算。使用组合解析器指定对str的解析策略。
 */
class ComparableField<V>(override val key: String, override val alias: Array<out String>, private val strTypeParser: StrTypeParser<V>) : FilterFieldByIdentify<V>() where V: ComparableValue<*>, V: EquableValue<*> {
    override fun generate(name: String, family: Family?, predicative: Predicative?): Filter<V> {
        if(family == null || predicative == null) TODO("ERROR: 缺少关系和值")

        return when (family.value) {
            ":" -> when(predicative) {
                is StrList -> processStrList(predicative)
                is Col -> processCol(predicative)
                is Range -> processRange(predicative)
                is SortList -> TODO("ERROR: 此处不支持排序列表")
                else -> throw RuntimeException("Unsupported predicative ${predicative::class.simpleName}.")
            }
            ">", "<", ">=", "<=" -> when(predicative) {
                is StrList -> processStrListForCompare(predicative, family.value)
                is SortList -> TODO("ERROR: 此处不支持排序列表")
                else -> TODO("ERROR: 比较符号不支持使用集合或区间作为值")
            }
            "~", "~+", "~-" -> TODO("ERROR: 不支持这几种关系符号")
            else -> throw RuntimeException("Unsupported family symbol '${family.value}'.")
        }
    }

    private fun processStrList(strList: StrList): EqualFilter<V> {
        if(strList.items.size > 1) TODO("ERROR: 关键字项的值不能使用标签地址段")
        val filterValue = strTypeParser.parse(strList.items.first().value)
        return EqualFilter(this, listOf(filterValue))
    }

    private fun processStrListForCompare(strList: StrList, symbol: String): RangeFilter<V> {
        if(strList.items.size > 1) TODO("ERROR: 关键字项的值不能使用标签地址段")
        val filterValue = strTypeParser.parse(strList.items.first().value)
        return when (symbol) {
            ">" -> RangeFilter(this, filterValue, null, includeBegin = false, includeEnd = false)
            ">=" -> RangeFilter(this, filterValue, null, includeBegin = true, includeEnd = false)
            "<" -> RangeFilter(this, null, filterValue, includeBegin = false, includeEnd = false)
            "<=" -> RangeFilter(this, null, filterValue, includeBegin = false, includeEnd = true)
            else -> throw RuntimeException("Unsupported family symbol '${symbol}'.")
        }
    }

    private fun processCol(col: Col): EqualFilter<V> {
        val filterValues = col.items.asSequence().map { strTypeParser.parse(it.value) }.toList()
        return EqualFilter(this, filterValues)
    }

    private fun processRange(range: Range): RangeFilter<V> {
        val beginValue = strTypeParser.parse(range.from.value)
        val endValue = strTypeParser.parse(range.to.value)
        return RangeFilter(this, beginValue, endValue, includeBegin = range.includeFrom, includeEnd = range.includeTo)
    }
}

/**
 * 对关键字项进行标准解析的field。处理等价和匹配运算。根据str的精确性信息区分两者。
 */
class MatchableField<V>(override val key: String, override val alias: Array<out String>, private val strTypeParser: StrTypeParser<V>) : FilterFieldByIdentify<V>(), GeneratedSequenceByIdentify<Filter<V>> where V: MatchableValue<*>, V: EquableValue<*> {
    override fun generateSeq(name: String, family: Family?, predicative: Predicative?): Sequence<Filter<V>> {
        if(family == null || predicative == null) TODO("ERROR: 缺少关系和值")

        return when (family.value) {
            ":" -> when(predicative) {
                is StrList -> sequenceOf(processStrList(predicative))
                is Col -> processCol(predicative)
                is Range -> TODO("ERROR: 此处不支持区间")
                is SortList -> TODO("ERROR: 此处不支持排序列表")
                else -> throw RuntimeException("Unsupported predicative ${predicative::class.simpleName}.")
            }
            ">", "<", ">=", "<=" -> TODO("ERROR: 此处不支持比较运算")
            "~", "~+", "~-" -> TODO("ERROR: 不支持这几种关系符号")
            else -> throw RuntimeException("Unsupported family symbol '${family.value}'.")
        }
    }

    private fun processStrList(strList: StrList): Filter<V> {
        if(strList.items.size > 1) TODO("ERROR: 关键字项的值不能使用标签地址段")
        val filterValue = strTypeParser.parse(strList.items.first().value)
        return if(strList.items.first().type == Str.Type.BACKTICKS) {
            EqualFilter(this, listOf(filterValue))
        }else{
            MatchFilter(this, listOf(filterValue))
        }
    }

    private fun processCol(col: Col): Sequence<Filter<V>> {
        val (precise, match) = col.items.asSequence().map { Pair(it.type == Str.Type.BACKTICKS, strTypeParser.parse(it.value)) }.partition { (precise, _) -> precise }
        val equalFilter = if(precise.isNotEmpty()) EqualFilter(this, precise.map { (_, s) -> s }) else null
        val matchFilter = if(match.isNotEmpty()) MatchFilter(this, match.map { (_, s) -> s }) else null
        return when {
            equalFilter != null && matchFilter != null -> sequenceOf(equalFilter, matchFilter)
            equalFilter != null -> sequenceOf(equalFilter)
            matchFilter != null -> sequenceOf(matchFilter)
            else -> emptySequence()
        }
    }
}

/**
 * flag型field，只要此关键字出现就产生判定。
 */
class FlagField(override val key: String, override val alias: Array<out String>) : FilterFieldByIdentify<FilterNothingValue>() {
    override fun generate(name: String, family: Family?, predicative: Predicative?): FlagFilter {
        if(family != null || predicative != null) TODO("ERROR: 不应该有关系和值")
        return FlagFilter(this)
    }
}

/**
 * 数值型关键字项。
 */
fun numberField(key: String, vararg alias: String): FilterFieldDefinition<FilterNumberValue> = ComparableField(key, alias, NumberParser)

/**
 * 数值且可匹配的关键字项。
 */
fun patternNumberField(key: String, vararg alias: String): FilterFieldDefinition<FilterPatternNumberValue> {
    TODO()
}

/**
 * 日期型关键字项。
 */
fun dateField(key: String, vararg alias: String): FilterFieldDefinition<FilterDateValue> {
    TODO()
}

/**
 * 文件大小型关键字项。
 */
fun sizeField(key: String, vararg alias: String): FilterFieldDefinition<FilterSizeValue> = ComparableField(key, alias, SizeParser)

/**
 * 字符串型关键字项，对精确的字符串进行等价判断，非精确字符串模糊匹配。
 */
fun patternStringField(key: String, vararg alias: String): FilterFieldDefinition<FilterStringValue> = MatchableField(key, alias, StringParser)

/**
 * 字符串型关键字项，对所有字符串进行等价判断。
 */
fun stringField(key: String, vararg alias: String): FilterFieldDefinition<FilterStringValue> = EquableField(key, alias, StringParser)

/**
 * 枚举型关键字项。
 */
inline fun <reified E : Enum<E>> enumField(key: String, vararg alias: String): FilterFieldDefinition<FilterEnumValue<E>> = EquableField(key, alias, EnumParser(E::class.java.enumConstants))

/**
 * 标记型关键字项。
 */
fun flagField(key: String, vararg alias: String): FilterFieldDefinition<FilterNothingValue> = FlagField(key, alias)
