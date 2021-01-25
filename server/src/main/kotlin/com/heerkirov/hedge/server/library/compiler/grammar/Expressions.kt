package com.heerkirov.hedge.server.library.compiler.grammar

import com.heerkirov.hedge.server.library.compiler.grammar.expression.grammarExpression

enum class Prod {
    /**查询语句*/
    SEQUENCE,
    /**语句项*/
    SEQUENCE_ITEM,
    /**语句项主体*/
    SEQUENCE_BODY,
    /**元素*/
    ELEMENT,
    /**注解*/
    ANNOTATION,
    /**元素前缀*/
    ELEMENT_PREFIX,
    /**注解前缀*/
    ANNOTATION_PREFIX,
    /**注解二级前缀1*/
    ANNOTATION_SECONDARY_PREFIX_1,
    /**注解二级前缀2*/
    ANNOTATION_SECONDARY_PREFIX_2,
    /**注解二级前缀3*/
    ANNOTATION_SECONDARY_PREFIX_3,
    /**注解项*/
    ANNOTATION_ITEM,
    /**元素项*/
    ELEMENT_ITEM,
    /**主系表结构*/
    SFP,
    /**主语*/
    SUBJECT,
    /**单目系语*/
    UNARY_FAMILY,
    /**系语*/
    FAMILY,
    /**表语*/
    PREDICATIVE,
    /**字符串*/
    STRING,
    /**集合*/
    COLLECTION,
    /**集合项*/
    COLLECTION_ITEM,
    /**区间*/
    RANGE,
    /**区间起始符*/
    RANGE_BEGIN_SYMBOL,
    /**区间终止符*/
    RANGE_END_SYMBOL,
    /**排序列表*/
    SORT_LIST,
    /**有序排序项*/
    ORDERED_SORT_ITEM,
    /**排序项*/
    SORT_ITEM
}

val prodExpressions = grammarExpression<Prod> {
    Prod.SEQUENCE to listOf(Prod.SEQUENCE_ITEM)
    Prod.SEQUENCE to listOf(Prod.SEQUENCE, Prod.SEQUENCE_ITEM)
    Prod.SEQUENCE to listOf(Prod.SEQUENCE, "&", Prod.SEQUENCE_ITEM)

    Prod.SEQUENCE_ITEM to listOf(Prod.SEQUENCE_BODY)
    Prod.SEQUENCE_ITEM to listOf("^", Prod.SEQUENCE_BODY)
    Prod.SEQUENCE_ITEM to listOf("-", "^", Prod.SEQUENCE_BODY)

    Prod.SEQUENCE_BODY to listOf(Prod.ELEMENT)
    Prod.SEQUENCE_BODY to listOf(Prod.ANNOTATION)

    Prod.ELEMENT to listOf(Prod.ELEMENT_ITEM)
    Prod.ELEMENT to listOf(Prod.ELEMENT_PREFIX, Prod.ELEMENT_ITEM)

    Prod.ANNOTATION to listOf("[", Prod.ANNOTATION_ITEM, "]")
    Prod.ANNOTATION to listOf("[", Prod.ANNOTATION_PREFIX, Prod.ANNOTATION_ITEM, "]")

    Prod.ELEMENT_PREFIX to listOf("@")
    Prod.ELEMENT_PREFIX to listOf("#")
    Prod.ELEMENT_PREFIX to listOf("$")

    Prod.ANNOTATION_PREFIX to listOf("@")
    Prod.ANNOTATION_PREFIX to listOf("#")
    Prod.ANNOTATION_PREFIX to listOf("$")
    Prod.ANNOTATION_PREFIX to listOf("@", Prod.ANNOTATION_SECONDARY_PREFIX_1)
    Prod.ANNOTATION_PREFIX to listOf("#", Prod.ANNOTATION_SECONDARY_PREFIX_2)
    Prod.ANNOTATION_PREFIX to listOf("$", Prod.ANNOTATION_SECONDARY_PREFIX_3)

    Prod.ANNOTATION_SECONDARY_PREFIX_1 to listOf("#")
    Prod.ANNOTATION_SECONDARY_PREFIX_1 to listOf("$")
    Prod.ANNOTATION_SECONDARY_PREFIX_1 to listOf("#", "$")
    Prod.ANNOTATION_SECONDARY_PREFIX_1 to listOf("$", "#")

    Prod.ANNOTATION_SECONDARY_PREFIX_2 to listOf("@")
    Prod.ANNOTATION_SECONDARY_PREFIX_2 to listOf("$")
    Prod.ANNOTATION_SECONDARY_PREFIX_2 to listOf("@", "$")
    Prod.ANNOTATION_SECONDARY_PREFIX_2 to listOf("$", "@")

    Prod.ANNOTATION_SECONDARY_PREFIX_3 to listOf("@")
    Prod.ANNOTATION_SECONDARY_PREFIX_3 to listOf("#")
    Prod.ANNOTATION_SECONDARY_PREFIX_3 to listOf("@", "#")
    Prod.ANNOTATION_SECONDARY_PREFIX_3 to listOf("#", "@")

    Prod.ANNOTATION_ITEM to listOf(string)
    Prod.ANNOTATION_ITEM to listOf(Prod.ANNOTATION_ITEM, "|", string)
    Prod.ANNOTATION_ITEM to listOf(Prod.ANNOTATION_ITEM, "/", string)

    Prod.ELEMENT_ITEM to listOf(Prod.SFP)
    Prod.ELEMENT_ITEM to listOf(Prod.ELEMENT_ITEM, "|", Prod.SFP)
    Prod.ELEMENT_ITEM to listOf(Prod.ELEMENT_ITEM, "/", Prod.SFP)

    Prod.SFP to listOf(Prod.SUBJECT)
    Prod.SFP to listOf(Prod.SUBJECT, Prod.UNARY_FAMILY)
    Prod.SFP to listOf(Prod.SUBJECT, Prod.FAMILY, Prod.PREDICATIVE)

    Prod.SUBJECT to listOf(Prod.STRING)

    Prod.UNARY_FAMILY to listOf("~+")
    Prod.UNARY_FAMILY to listOf("~-")

    Prod.FAMILY to listOf(":")
    Prod.FAMILY to listOf(">")
    Prod.FAMILY to listOf(">=")
    Prod.FAMILY to listOf("<")
    Prod.FAMILY to listOf("<=")
    Prod.FAMILY to listOf("~")

    Prod.PREDICATIVE to listOf(Prod.STRING)
    Prod.PREDICATIVE to listOf(Prod.COLLECTION)
    Prod.PREDICATIVE to listOf(Prod.RANGE)
    Prod.PREDICATIVE to listOf(Prod.SORT_LIST)

    Prod.STRING to listOf(string)
    Prod.STRING to listOf(Prod.STRING, ".", string)

    Prod.COLLECTION to listOf("{", Prod.COLLECTION_ITEM, "}")

    Prod.COLLECTION_ITEM to listOf(string)
    Prod.COLLECTION_ITEM to listOf(Prod.COLLECTION_ITEM, ",", string)

    Prod.RANGE to listOf(Prod.RANGE_BEGIN_SYMBOL, string, ",", string, Prod.RANGE_END_SYMBOL)

    Prod.RANGE_BEGIN_SYMBOL to listOf("[")
    Prod.RANGE_BEGIN_SYMBOL to listOf("(")

    Prod.RANGE_END_SYMBOL to listOf("]")
    Prod.RANGE_END_SYMBOL to listOf(")")

    Prod.SORT_LIST to listOf(Prod.ORDERED_SORT_ITEM)
    Prod.SORT_LIST to listOf(Prod.SORT_LIST, ",", Prod.ORDERED_SORT_ITEM)

    Prod.ORDERED_SORT_ITEM to listOf(Prod.SORT_ITEM)
    Prod.ORDERED_SORT_ITEM to listOf("-", Prod.SORT_ITEM)
    Prod.ORDERED_SORT_ITEM to listOf("+", Prod.SORT_ITEM)

    Prod.SORT_ITEM to listOf(string)
    Prod.SORT_ITEM to listOf("^", string)
}