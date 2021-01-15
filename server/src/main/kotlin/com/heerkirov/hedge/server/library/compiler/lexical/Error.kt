package com.heerkirov.hedge.server.library.compiler.lexical

import com.heerkirov.hedge.server.library.compiler.utils.LexicalError
import com.heerkirov.hedge.server.library.compiler.utils.range

/**
 * 转义了一个普通字符，而非需要被转义的符号。
 */
class NormalCharacterEscaped(char: Char, pos: Int) : LexicalError(1001, "Escaped a normal character $char", range(pos - 1, pos))

/**
 * 希望遇到字符串终结符，但是却遇到了字符串末尾。终结符丢失。
 */
class ExpectQuoteButEOF(quote: Char, pos: Int) : LexicalError(1002, "Expecting quote $quote but actually EOF", range(pos))

/**
 * 希望在转义字符后遇到一个符号用于转义，但是却遇到了字符串末尾。转义符号丢失。
 */
class ExpectEscapedCharacterButEOF(pos: Int) : LexicalError(1003, "Expecting an escaped character but actually EOF", range(pos - 1, pos))

/**
 * 在一个受限字符串中出现了字符串符号。正确的写法是写在无限字符串中，然后转义。
 */
class FoundQuoteInRestrictedString(quote: Char, pos: Int) : LexicalError(1004, "Found quote $quote in a restricted string", range(pos))