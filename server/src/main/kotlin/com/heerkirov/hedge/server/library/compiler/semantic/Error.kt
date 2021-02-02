package com.heerkirov.hedge.server.library.compiler.semantic

import com.heerkirov.hedge.server.library.compiler.utils.SemanticError
import com.heerkirov.hedge.server.library.compiler.utils.range

/**
 * 一个基本信息单元。
 * @param key 对于filter，它是定义field时的key；对于element，它是生成器定义时的itemName。用来标记此错误抛出的项目种类。
 */
open class FilterInfo(val key: String)

/**
 * 值的类型。
 */
enum class ValueType { COLLECTION, RANGE, SORT_LIST }

/**
 * 此关键字项目要求关系和值，但是缺失了关系和值。[begin, end)应标记关键字的subject。
 */
class FilterValueRequired(filterName: String, beginIndex: Int, endIndex: Int) : SemanticError<FilterInfo>(3001, "Filter $filterName: relation and value is required.", range(beginIndex, endIndex), FilterInfo(filterName))

/**
 * 此关键字项目不应该有关系和值。[begin, end)应标记关键字的sfp。
 */
class FilterValueNotRequired(filterName: String, beginIndex: Int, endIndex: Int) : SemanticError<FilterInfo>(3002, "Filter $filterName: relation and value is not required.", range(beginIndex, endIndex), FilterInfo(filterName))

/**
 * 此关键字项目不支持这个种类的值。和下一个的区别是，无论如何不应该出现这个种类的值。[begin, end)应标记predicative。
 */
class UnsupportedFilterValueType(filterName: String, valueType: ValueType, beginIndex: Int, endIndex: Int) : SemanticError<UnsupportedFilterValueType.SelfFilterInfo>(3003, "Filter $filterName: type $valueType is unsupported.", range(beginIndex, endIndex), SelfFilterInfo(filterName, valueType)) {
    class SelfFilterInfo(filterName: String, val valueType: ValueType) : FilterInfo(filterName)
}

/**
 * 此关键字项目下，当前关系不支持这个种类的值。和上一个的区别是，换一个运算符号可能支持。[begin, end)应标记predicative。
 */
class UnsupportedFilterValueTypeOfRelation(filterName: String, valueType: ValueType, symbol: String, beginIndex: Int, endIndex: Int) : SemanticError<UnsupportedFilterValueTypeOfRelation.SelfFilterInfo>(3004, "Filter $filterName: type $valueType is unsupported in relation '$symbol'.", range(beginIndex, endIndex), SelfFilterInfo(filterName, valueType, symbol)) {
    class SelfFilterInfo(filterName: String, val valueType: ValueType, val symbol: String) : FilterInfo(filterName)
}

/**
 * 此关键字项目不支持这个种类的关系运算。[begin, end)应标记family。
 */
class UnsupportedFilterRelationSymbol(filterName: String, symbol: String, beginIndex: Int, endIndex: Int) : SemanticError<UnsupportedFilterRelationSymbol.SelfFilterInfo>(3005, "Filter $filterName: relation '$symbol' is unsupported.", range(beginIndex, endIndex), SelfFilterInfo(filterName, symbol)) {
    class SelfFilterInfo(filterName: String, val symbol: String) : FilterInfo(filterName)
}

/**
 * 值不能写成meta tag地址段的形式(a.b.c)，只能是一项string。[begin, end)应标记地址段strList。
 */
class ValueCannotBeAddress(beginIndex: Int, endIndex: Int) : SemanticError<Nothing>(3006, "Value cannot be a tag address.", range(beginIndex, endIndex), null)

/**
 * 值在比较运算或区间中不能写成模糊匹配项。[begin, end)应标记值。
 */
class ValueCannotBePatternInComparison(beginIndex: Int, endIndex: Int) : SemanticError<Nothing>(3007, "Value in comparison relation or range cannot be pattern.", range(beginIndex, endIndex), null)

/**
 * 类型转换错误：str无法转换为目标类型的值。[begin, end)应标记值。
 */
class TypeCastError(value: String, type: Type, beginIndex: Int, endIndex: Int) : SemanticError<TypeCastError.Info>(3008, "Type cast error: '$value' cannot be cast to type $type.", range(beginIndex, endIndex), Info(value, type)) {
    class Info(val value: String, val type: Type)
    enum class Type { NUMBER, SIZE, DATE }
}

/**
 * 类型转换错误：str无法转换为目标枚举类型的值。[begin, end)应标记值。
 */
class EnumTypeCastError(value: String, type: String, expected: List<String>, beginIndex: Int, endIndex: Int) : SemanticError<EnumTypeCastError.Info>(3009, "Type cast error: '$value' cannot be cast to enum type $type. Expected $expected.", range(beginIndex, endIndex), Info(value, type, expected)) {
    class Info(val value: String, val type: String, val expected: List<String>)
}

/**
 * 此条meta tag元素的结构不满足显式指定的类型限制。topic(#)要求结构不能有关系和值; author(@)要求结构必须是单节地址。[begin, end)应标记整个element。
 */
class InvalidMetaTagForThisPrefix(symbol: String, beginIndex: Int, endIndex: Int) : SemanticError<String>(3010, "Invalid meta tag structure for prefix '$symbol'.", range(beginIndex, endIndex), symbol)

/**
 * 这一种类的element要求不能有类型前缀，但是给出了前缀。[begin, end)应标记element。
 */
class ElementPrefixNotRequired(itemName: String, beginIndex: Int, endIndex: Int) : SemanticError<FilterInfo>(3011, "Element of $itemName: prefix is not required.", range(beginIndex, endIndex), FilterInfo(itemName))

/**
 * 此元素项目不应该有关系和值。[begin, end)应标记关键字的sfp。
 */
class ElementValueNotRequired(itemName: String, beginIndex: Int, endIndex: Int) : SemanticError<FilterInfo>(3012, "Element of $itemName: relation and value is not required.", range(beginIndex, endIndex), FilterInfo(itemName))

/**
 * 此元素项目不支持这个种类的值。和下一个的区别是，无论如何不应该出现这个种类的值。[begin, end)应标记predicative。
 */
class UnsupportedElementValueType(itemName: String, valueType: ValueType, beginIndex: Int, endIndex: Int) : SemanticError<UnsupportedElementValueType.SelfFilterInfo>(3013, "Element of $itemName: type $valueType is unsupported.", range(beginIndex, endIndex), SelfFilterInfo(itemName, valueType)) {
    class SelfFilterInfo(filterName: String, val valueType: ValueType) : FilterInfo(filterName)
}

/**
 * 此元素项目下，当前关系不支持这个种类的值。和上一个的区别是，换一个运算符号可能支持。[begin, end)应标记predicative。
 */
class UnsupportedElementValueTypeOfRelation(itemName: String, valueType: ValueType, symbol: String, beginIndex: Int, endIndex: Int) : SemanticError<UnsupportedElementValueTypeOfRelation.SelfFilterInfo>(3014, "Element of $itemName: type $valueType is unsupported in relation '$symbol'.", range(beginIndex, endIndex), SelfFilterInfo(itemName, valueType, symbol)) {
    class SelfFilterInfo(filterName: String, val valueType: ValueType, val symbol: String) : FilterInfo(filterName)
}
