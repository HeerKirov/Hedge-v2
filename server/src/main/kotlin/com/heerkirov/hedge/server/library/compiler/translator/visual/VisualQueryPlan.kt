package com.heerkirov.hedge.server.library.compiler.translator.visual

data class VisualQueryPlan(
    val orders: List<String>,
    val elements: List<Element<*>>,
    val filters: List<FilterItem>
)


data class FilterItem(val exclude: Boolean, val fields: List<FilterOfOneField<*>>)

data class FilterOfOneField<V : Any>(val name: String, val values: List<FilterValue<V>>)

interface FilterValue<V : Any> {
    val type: String
}

data class FilterEqual<V : Any>(val value: V) : FilterValue<V> {
    override val type: String get() = "equal"
}

data class FilterMatch<V : Any>(val value: V): FilterValue<V> {
    override val type: String get() = "match"
}

data class FilterRange<V : Any>(val begin: V?, val end: V?, val includeBegin: Boolean, val includeEnd: Boolean) : FilterValue<V> {
    override val type: String get() = "range"
}


data class Element<V : ElementValue>(val type: String, val intersectItems: List<ElementItem<V>>)

data class ElementItem<V : ElementValue>(val exclude: Boolean, val unionItems: List<V>)

interface ElementValue

data class ElementString(val value: String, val precise: Boolean) : ElementValue

interface ElementMeta : ElementValue {
    val type: String
    val id: Int
    val name: String
}

data class ElementAnnotation(override val id: Int, override val name: String) : ElementMeta {
    override val type: String get() = "annotation"
}

data class ElementTopic(override val id: Int, override val name: String) : ElementMeta {
    override val type: String get() = "topic"
}

data class ElementAuthor(override val id: Int, override val name: String) : ElementMeta {
    override val type: String get() = "author"
}

data class ElementTag(override val id: Int, override val name: String, val tagType: String, val color: String?, val realTags: List<RealTag>?) : ElementMeta {
    override val type: String get() = "tag"

    data class RealTag(val id: Int, val name: String, val isAddr: Boolean)
}