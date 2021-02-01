package com.heerkirov.hedge.server.library.compiler.semantic.plan


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