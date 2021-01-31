package com.heerkirov.hedge.server.library.compiler.semantic

import com.heerkirov.hedge.server.library.compiler.semantic.dialect.FilterFieldDefinition

/**
 * 查询计划实例。
 */
class QueryPlan(
    /**
     * 排序计划。
     */
    val orders: Orders,
    /**
     * 筛选过滤器。
     */
    val filters: IntersectFilters,
    /**
     * 连接过滤器。
     */
    val joins: JoinFilters
)

/**
 * 排序列表。其中的排序项有序排布，并指定名称和方向，因此可以翻译为排序指令。
 */
typealias Orders = List<Order>

/**
 * 一个排序项。记录排序项的名字和它的方向。
 */
data class Order(val value: String, private val desc: Boolean) {
    fun isDescending() = desc
    fun isAscending() = !desc
}

typealias IntersectFilters = List<UnionFilters>

data class UnionFilters(private val filters: Collection<Filter<out FilterValue>>, val exclude: Boolean) : Collection<Filter<out FilterValue>> by filters

/**
 * 过滤器项。每一条过滤器项代表一个关系判别表达式子项。它包含一项属性定义，然后由实现确定关系类型和关系目标值。
 */
interface Filter<V : FilterValue> {
    /**
     * 过滤器指向的属性定义。属性定义的泛型参数已经锁定了它能启用的关系类型和目标值类型。
     */
    val field: FilterFieldDefinition<V>
}

/**
 * 等价过滤器。此属性必须与目标值完全相等。目标值可给出多个，满足任一即达成判定条件。
 */
class NewEqualFilter<V : EquableValue>(override val field: FilterFieldDefinition<V>, val values: Collection<V>) : Filter<V>

/**
 * 匹配过滤器。此属性必须与目标值按匹配规则模糊匹配。目标值可给出多个，满足任一即达成判定条件。
 */
class NewMatchFilter<V : MatchableValue>(override val field: FilterFieldDefinition<V>, val values: Collection<V>) : Filter<V>

/**
 * 范围比较过滤器。此属性必须满足给定的begin to end的上下界范围。include参数决定是否包含上下界。
 */
class NewRangeFilter<V : ComparableValue>(override val field: FilterFieldDefinition<V>, val begin: V?, val end: V?, val includeBegin: Boolean, val includeEnd: Boolean) : Filter<V>

/**
 * 标记过滤器。此属性是布尔属性，没有目标值。
 */
class FlagFilter(override val field: FilterFieldDefinition<FilterNothingValue>) : Filter<FilterNothingValue>

/**
 * filter的目标值。
 */
interface FilterValue

/**
 * 可匹配的目标值类型。
 */
interface MatchableValue : FilterValue

/**
 * 可进行等价判定的目标值类型。
 */
interface EquableValue : FilterValue

/**
 * 可进行范围比较的目标值类型。
 */
interface ComparableValue : EquableValue

/**
 * 数字类型：可等价判断或区间比较。
 */
interface FilterNumberValue : FilterValue, EquableValue, ComparableValue

/**
 * 匹配数字类型：在数字类型的基础上，追加可进行匹配判断。
 */
interface FilterPatternNumberValue : FilterNumberValue, MatchableValue

/**
 * 日期类型：可等价判断或区间比较。
 */
interface FilterDateValue : FilterValue, EquableValue, ComparableValue

/**
 * 文件大小类型：可等价判断或区间比较。
 */
interface FilterSizeValue : FilterValue, EquableValue, ComparableValue

/**
 * 字符串类型：可等价判断或匹配判断。
 */
interface FilterStringValue : FilterValue, EquableValue, MatchableValue

/**
 * 枚举类型：可等价判断。
 */
interface FilterEnumValue : FilterValue, EquableValue

/**
 * Nothing类型：只能用作布尔值。
 */
interface FilterNothingValue : FilterValue

/**
 * 连接过滤器的列表，相当于合取范式。
 */
typealias JoinFilters = List<JoinFilter<*>>

/**
 * 连接过滤器。连接过滤是标准的合取范式，每个连接过滤器都是一个合取项。
 */
interface JoinFilter<V : Any> {
    /**
     * 过滤器的子项。彼此之间通过或计算连接。
     */
    val items: List<V>
}

/**
 * 实现为注解的连接过滤器。注解过滤器的每一个子项都是一个简单的String。它可以指定多个连接目标类型。
 */
class AnnotationJoinFilter(override val items: List<MetaPartial>, val metaType: Set<MetaType>, val exclude: Boolean) : JoinFilter<MetaPartial> {
    /**
     * 连接过滤器中的连接目标类型。
     */
    enum class MetaType {
        AT, POUND, DOLLAR
    }
}

/**
 * 实现为父级meta tag的过滤器。它很特殊，尽管实际实现的时候它是参与where运算的，但它需要预查询，因此放到了这里。
 */
class ParentJoinFilter(override val items: List<MetaPartial>) : JoinFilter<MetaPartial>

/**
 * 实现为meta tag的连接过滤器。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对tag的实现。它在topic的基础上扩展了序列化成员。
 * @param noType 此过滤器没有标记类型，因此类型可能从tag开始向下扩展搜索。
 */
abstract class TagJoinFilter<M : MetaValue>(val noType: Boolean, val exclude: Boolean) : JoinFilter<M>

/**
 * 实现为meta tag的连接过滤器。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对topic的实现。它在author的基础上扩展了多级地址。
 */
abstract class TopicJoinFilter<M : SimpleMetaValue>(noType: Boolean, exclude: Boolean) : TagJoinFilter<M>(noType, exclude)

/**
 * 实现为meta tag的连接过滤器。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对author的实现。它只有单级地址。
 */
abstract class AuthorJoinFilter(noType: Boolean, exclude: Boolean) : TopicJoinFilter<SingleMetaValue>(noType, exclude)

/**
 * tag的实现。
 */
class TagJoinFilterImpl(override val items: List<MetaValue>, noType: Boolean, exclude: Boolean) : TagJoinFilter<MetaValue>(noType, exclude)

/**
 * topic的实现。
 */
class TopicJoinFilterImpl(override val items: List<SimpleMetaValue>, noType: Boolean, exclude: Boolean) : TopicJoinFilter<SimpleMetaValue>(noType, exclude)

/**
 * author的实现。
 */
class AuthorJoinFilterImpl(override val items: List<SingleMetaValue>, noType: Boolean, exclude: Boolean) : AuthorJoinFilter(noType, exclude)

/**
 * 一个在连接过滤器中的meta tag的表示值。
 */
sealed class MetaValue

/**
 * 表示单一的meta tag值。
 */
open class SimpleMetaValue(val value: MetaAddress) : MetaValue()

/**
 * 表示单一的meta tag值，且只有单段地址段。
 */
class SingleMetaValue(value: MetaPartial) : SimpleMetaValue(listOf(value)) {
    val singleValue: MetaPartial get() = value.first()
}

/**
 * 表示从一个序列化组meta tag下选择的限定值。
 */
open class SequentialMetaValue(val tag: MetaAddress) : MetaValue()

/**
 * 表示从一个序列化组员(不指定序列化组)衍生的序列化限定值。
 */
open class SequentialItemMetaValue(val tag: MetaAddress) : MetaValue()

/**
 * 从一个集合中选择序列化子项。
 */
class SequentialMetaValueCollection(tag: MetaAddress, val values: Set<MetaPartial>) : SequentialMetaValue(tag)

/**
 * 从一个区间范围选择序列化子项。其begin和end都是可选的。
 */
class SequentialMetaValueRange(tag: MetaAddress, val begin: MetaPartial?, val end: MetaPartial?, val includeBegin: Boolean, val includeEnd: Boolean) : SequentialMetaValue(tag)

/**
 * 从一个序列化组员到另一个组员，begin和end都包括。
 */
class SequentialItemMetaValueToOther(tag: MetaAddress, val otherTag: MetaPartial) : SequentialItemMetaValue(tag)

/**
 * 从一个序列化组员到指定的方向。
 */
class SequentialItemMetaValueToDirection(tag: MetaAddress, private val desc: Boolean) : SequentialItemMetaValue(tag) {
    fun isDescending() = desc
    fun isAscending() = !desc
}

/**
 * 用地址表示的meta tag。
 */
typealias MetaAddress = List<MetaPartial>

/**
 * 表示一个meta tag的值，或meta tag地址中的一段。
 * @param value 字面值
 * @param precise 是否是精准匹配的字面值
 */
data class MetaPartial(val value: String, val precise: Boolean)