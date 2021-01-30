package com.heerkirov.hedge.server.library.compiler.semantic

/**
 * 查询计划实例。
 */
class QueryPlan(
    /**
     * 排序计划。
     */
    val orders: OrderList,
    /**
     * 筛选过滤器。
     */
    val filters: Filter,
    /**
     * 连接过滤器。
     */
    val joins: JoinFilterList
)

/**
 * 排序列表。其中的排序项有序排布，并指定名称和方向，因此可以翻译为排序指令。
 */
typealias OrderList = List<Order>

/**
 * 一个排序项。记录排序项的名字和它的方向。
 */
data class Order(val value: String, private val desc: Boolean) {
    fun isDescending() = desc
    fun isAscending() = !desc
}

/**
 * 筛选过滤器。
 */
interface Filter

/**
 * 承担集合运算功能的过滤器。
 */
interface LogicOperationFilter : Filter

/**
 * 交集过滤器。
 */
class IntersectFilter(private val items: Collection<Filter>) : LogicOperationFilter, Collection<Filter> by items

/**
 * 并集过滤器。
 */
class UnionFilter(private val items: Collection<Filter>) : LogicOperationFilter, Collection<Filter> by items

/**
 * 补集过滤器。
 */
class NotFilter(val value: Filter) : LogicOperationFilter

/**
 * 承担关系计算功能的过滤器。
 */
interface RelationOperationFilter<V : Any> : Filter {
    /**
     * 关系表达式左侧的项名。
     */
    val key: String
}

/**
 * 等价关系。
 * @param V 值的类型。只会有Int, Long, String, LocalDate几种可能。
 */
class EqualFilter<V : Any>(override val key: String, val value: V) : RelationOperationFilter<V>

/**
 * 匹配关系。
 * @param value sql匹配字符串类型的匹配值。
 */
class MatchFilter(override val key: String, val value: String) : RelationOperationFilter<String>

/**
 * 比较关系。
 * @param V 值的类型。只会有Int, Long, LocalDate几种可能。
 */
class CompareFilter<V : Comparable<V>>(override val key: String, val comparison: Comparison, val value: V) : RelationOperationFilter<V> {
    enum class Comparison { GREATER_THAN, GREATER_THAN_EQUAL, LESS_THAN, LESS_THAN_EQUAL }
}

/**
 * 连接过滤器的列表，相当于合取范式。
 */
typealias JoinFilterList = List<JoinFilter<*>>

/**
 * 连接过滤器。连接过滤是标准的合取范式，每个连接过滤器都是一个合取项。
 */
interface JoinFilter<V : Any> {
    /**
     * 过滤器的子项。彼此之间通过或计算连接。
     */
    val items: List<V>
    /**
     * 排除项。
     */
    val exclude: Boolean
}

/**
 * 连接过滤器中的前缀符号。
 */
enum class JoinPrefixSymbol {
    AT, POUND, DOLLAR
}

/**
 * 实现为注解的连接过滤器。注解过滤器的每一个子项都是一个简单的String。它的类型前缀是个集合。
 */
class AnnotationJoinFilter(override val items: List<MetaTagValue>, val prefix: Set<JoinPrefixSymbol>, override val exclude: Boolean) : JoinFilter<MetaTagValue>

/**
 * 实现为标签的连接过滤器。标签过滤器的子项类型更为复杂，因此使用一个新类型表示。它的类型前缀是个可选值。
 */
class MetaTagJoinFilter(override val items: List<String>, val prefix: JoinPrefixSymbol?, override val exclude: Boolean) : JoinFilter<String>

/**
 * 一个在连接过滤器中的meta tag的表示值。
 */
sealed class MetaTagValue(val tag: MetaTagAddress)

/**
 * 表示单一的meta tag值。
 */
class SimpleMetaTag(tag: MetaTagAddress) : MetaTagValue(tag)

/**
 * 表示从一个序列化组meta tag下选择的限定值。
 */
open class SequentialMetaTag(tag: MetaTagAddress) : MetaTagValue(tag)

/**
 * 从一个集合中选择序列化子项。
 */
class SequentialMetaTagCollection(tag: MetaTagAddress, val values: Set<PartialMetaTag>) : SequentialMetaTag(tag)

/**
 * 从一个区间范围选择序列化子项。其begin和end都是可选的。
 */
class SequentialMetaTagRange(tag: MetaTagAddress, val begin: PartialMetaTag?, val end: PartialMetaTag?, val includeBegin: Boolean, val includeEnd: Boolean) : SequentialMetaTag(tag)

/**
 * 表示从一个序列化组员(不指定序列化组)衍生的序列化限定值。
 */
open class SequentialItemMetaTag(tag: MetaTagAddress) : MetaTagValue(tag)

/**
 * 从一个序列化组员到另一个组员，begin和end都包括。
 */
class SequentialItemMetaTagToOther(tag: MetaTagAddress, val otherTag: PartialMetaTag) : SequentialItemMetaTag(tag)

/**
 * 从一个序列化组员到指定的方向。
 */
class SequentialItemMetaTagToDirection(tag: MetaTagAddress, private val desc: Boolean) : SequentialItemMetaTag(tag) {
    fun isDescending() = desc
    fun isAscending() = !desc
}

/**
 * 用地址表示的meta tag。
 */
typealias MetaTagAddress = List<PartialMetaTag>

/**
 * 表示一个meta tag的值，或meta tag地址中的一段。
 * @param value 字面值
 * @param precise 是否是精准匹配的字面值
 */
data class PartialMetaTag(val value: String, val precise: Boolean)