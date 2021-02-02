package com.heerkirov.hedge.server.library.compiler.semantic.plan


/**
 * 连接元素的列表，相当于合取范式。
 */
typealias Elements = List<Element<*>>

/**
 * 连接元素。连接元素都是标准的合取范式，每个元素都是一个合取项。
 */
interface Element<V : Any> {
    /**
     * 元素的子项。彼此之间通过或计算连接。
     */
    val items: List<V>
    /**
     * 排除这个元素。
     */
    val exclude: Boolean
}


/**
 * 实现为名称的连接元素。
 */
class NameElement(override val items: List<MetaString>, override val exclude: Boolean) : Element<MetaString>

/**
 * 实现为注解的连接元素。注解元素的每一个子项都是一个简单的String。它可以指定多个连接目标类型。
 */
class AnnotationElement(override val items: List<MetaString>, val metaType: Set<MetaType>, override val exclude: Boolean) : Element<MetaString> {
    /**
     * 连接元素中的连接目标类型。
     */
    enum class MetaType {
        Tag, Topic, Author
    }
}

/**
 * 实现为源标签的连接元素。
 */
class SourceTagElement(override val items: List<MetaString>, override val exclude: Boolean) : Element<MetaString>

/**
 * 实现为meta tag的连接元素。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对tag的实现。它在topic的基础上扩展了序列化成员。
 * @param noType 此元素没有标记类型，因此类型可能从tag开始向下扩展搜索。
 */
abstract class TagElement<M : MetaValue>(val noType: Boolean, override val exclude: Boolean) : Element<M>

/**
 * 实现为meta tag的连接元素。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对topic的实现。它在author的基础上扩展了多级地址。
 */
abstract class TopicElement<M : SimpleMetaValue>(noType: Boolean, exclude: Boolean) : TagElement<M>(noType, exclude)

/**
 * 实现为meta tag的连接元素。它是一个抽象类，并应对三种不同的meta tag有各自的实现。当前层级是对author的实现。它只有单级地址。
 */
abstract class AuthorElement(noType: Boolean, exclude: Boolean) : TopicElement<SingleMetaValue>(noType, exclude)

/**
 * tag的实现。
 */
class TagElementImpl(override val items: List<MetaValue>, noType: Boolean, exclude: Boolean) : TagElement<MetaValue>(noType, exclude)

/**
 * topic的实现。
 */
class TopicElementImpl(override val items: List<SimpleMetaValue>, noType: Boolean, exclude: Boolean) : TopicElement<SimpleMetaValue>(noType, exclude)

/**
 * author的实现。
 */
class AuthorElementImpl(override val items: List<SingleMetaValue>, noType: Boolean, exclude: Boolean) : AuthorElement(noType, exclude)


/**
 * 一个在连接元素中的meta tag的表示值。
 */
sealed class MetaValue

/**
 * 表示单一的meta tag值。
 */
open class SimpleMetaValue(val value: MetaAddress) : MetaValue()

/**
 * 表示单一的meta tag值，且只有单段地址段。
 */
class SingleMetaValue(value: MetaAddress) : SimpleMetaValue(value) {
    val singleValue: MetaString get() = value.first()
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
class SequentialMetaValueOfCollection(tag: MetaAddress, val values: Collection<MetaString>) : SequentialMetaValue(tag)

/**
 * 从一个区间范围选择序列化子项。其begin和end都是可选的。
 */
class SequentialMetaValueOfRange(tag: MetaAddress, val begin: MetaString?, val end: MetaString?, val includeBegin: Boolean, val includeEnd: Boolean) : SequentialMetaValue(tag)

/**
 * 从一个序列化组员到另一个组员，begin和end都包括。
 */
class SequentialItemMetaValueToOther(tag: MetaAddress, val otherTag: MetaString) : SequentialItemMetaValue(tag)

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
typealias MetaAddress = List<MetaString>

/**
 * 表示一个meta tag的值，或meta tag地址中的一段。
 * @param value 字面值
 * @param precise 是否是精准匹配的字面值
 */
data class MetaString(val value: String, val precise: Boolean)