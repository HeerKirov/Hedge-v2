package com.heerkirov.hedge.server.library.compiler.translator

import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError


/**
 * (warning)元素类的meta tag或annotation的字面值给出了空串。
 */
class BlankElement : TranslatorError<Nothing>(4001, "Element cannot be blank.")

/**
 * (warning)元素类的meta tag或annotation的一个合取项匹配了数量为0的实现。这将导致整个匹配表达式为false。
 */
class ElementMatchesNone(items: List<String>) : TranslatorError<List<String>>(4002, "Element matches none.", info = items)