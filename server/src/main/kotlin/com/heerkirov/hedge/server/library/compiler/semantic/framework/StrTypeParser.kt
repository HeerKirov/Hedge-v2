package com.heerkirov.hedge.server.library.compiler.semantic.framework

import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import java.util.regex.Pattern

/**
 * str类型到filterValue的转换器。
 */
interface StrTypeParser<R : FilterValue> {
    fun parse(str: String): R
}

object StringParser : StrTypeParser<FilterStringValue> {
    override fun parse(str: String) = FilterStringValueImpl(str)
}

class EnumParser<E : Enum<E>>(private val values: Array<E>) : StrTypeParser<FilterEnumValue<E>> {
    override fun parse(str: String): FilterEnumValue<E> {
        for (value in values) {
            if(value.name.equals(str, ignoreCase = true)) {
                return FilterEnumValueImpl(value)
            }
        }
        TODO("ERROR: 无法转换为此enum类型的值")
    }
}

object NumberParser : StrTypeParser<FilterNumberValue> {
    override fun parse(str: String): FilterNumberValue {
        val i = str.toIntOrNull() ?: TODO("ERROR: 无法转换为number类型的值")
        return FilterNumberValueImpl(i)
    }
}

object SizeParser : StrTypeParser<FilterSizeValue> {
    private val pattern = Pattern.compile("""(\d+)([a-zA-Z]+)""")
    private val units = mapOf(
        "b" to 1L,
        "kb" to 1000L,
        "mb" to 1000L * 1000,
        "gb" to 1000L * 1000 * 1000,
        "tb" to 1000L * 1000 * 1000 * 1000,
        "kib" to 1024L,
        "mib" to 1024L * 1024,
        "gib" to 1024L * 1024 * 1024,
        "tib" to 1024L * 1024 * 1024 * 1024
    )

    override fun parse(str: String): FilterSizeValue {
        val match = pattern.matcher(str)
        if(match.find()) {
            val size = match.group(1).toLongOrNull() ?: TODO("ERROR: 无法转换为size类型的值")
            val unit = units[match.group(2).toLowerCase()] ?: TODO("ERROR: 不是合法的size类型单位")
            return FilterSizeValueImpl(size * unit)
        }else TODO("ERROR: 无法转换为size类型的值")
    }
}

object DateParser : StrTypeParser<FilterDateValue> {
    override fun parse(str: String): FilterDateValue {
        TODO("设计问题：这个parser的设计满足不了复杂类型的解析")
        // NumberPattern和Date这种类型，并不满足于解析为单一值，是有可能解析成区间的
    }
}

