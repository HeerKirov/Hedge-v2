package com.heerkirov.hedge.server.library.compiler.translator

import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError


/**
 * (warning)元素类的meta tag或annotation的字面值给出了空串。
 */
class BlankElement : TranslatorError<Nothing>(4001, "Element cannot be blank.")

/**
 * (warning)元素类的meta tag或annotation的一个合取项匹配了数量为0的实现。这将导致整个匹配表达式为false。
 */
class ElementMatchesNone(items: List<String>) : TranslatorError<List<String>>(4002, "Element '${items.joinToString("|")}' matches none.", info = items)

/**
 * (warning)元素类的meta tag或annotation查询所对应的项的数量达到了警告阈值。这意味着一个连接查询中的or项目可能过多，拖慢查询速度。
 */
class NumberOfUnionItemExceed(items: List<String>, warningLimit: Int) : TranslatorError<NumberOfUnionItemExceed.Info>(4003, "The number of the union items exceeds the warning limit $warningLimit.", info = Info(items, warningLimit)) {
    data class Info(val items: List<String>, val warningLimit: Int)
}

/**
 * (warning)元素类的meta tag或annotation查询的合取项的数量达到了警告阈值。这意味着连接查询的层数可能过多，严重拖慢查询速度。
 */
class NumberOfIntersectItemExceed(warningLimit: Int) : TranslatorError<Int>(4004, "The number of the intersect items exceeds the warning limit $warningLimit.", info = warningLimit)