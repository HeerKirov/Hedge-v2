package com.heerkirov.hedge.server.library.compiler.lexical

/**
 * 单字符符号表。
 */
internal val singleSymbols = arrayOf(
    '|', '&', '-', '+',
    '>', '<', ':', '~',
    '[', ']', '(', ')', '{', '}',
    '@', '#', '$', '^', '!', '.', ','
)

/**
 * 双字符符号表。前缀必定是某种可用的单字符符号。
 */
internal val doubleSymbols = arrayOf(
    ">=", "<=", "--", "++"
)

/**
 * 构成空格的字符表。
 */
internal val spaceSymbols = arrayOf(
    ' ', '\n', '\r', '\t'
)

/**
 * 受限字符串中，不能使用的单个字符。它是单字符符号表的子集。也就是两个集合的差集是会被识别为单字符符号，但也允许出现在受限字符串中的符号。
 */
internal val restrictedSymbols = arrayOf(
    '|', '&', '-', '+',
    '>', '<', ':', '~',
    '[', ']', '(', ')', '{', '}',
    '.', ','
)

/**
 * 识别为无限字符串的开始结束符的字符表，并指向类型枚举。
 */
internal val stringSymbols = mapOf(
    '\'' to CharSequenceType.APOSTROPHE,
    '"' to CharSequenceType.DOUBLE_QUOTES,
    '`' to CharSequenceType.BACKTICKS
)

/**
 * 无限字符串中标准的转义符号表。
 */
internal val escapeSymbols = mapOf(
    'n' to '\n',
    't' to '\t',
    'r' to '\r',
    '"' to '"',
    '`' to '`',
    '\'' to '\'',
    '\\' to '\\'
)

/**
 * 双字符符号：前缀符号对后一个符号的映射。
 */
internal val doubleSymbolsMap = doubleSymbols.asSequence().groupBy({ it[0] }) { it[1] }

/**
 * 字符串符号反转：枚举指向字符。
 */
internal val stringSymbolsReflect = stringSymbols.asSequence().map { it.value to it.key }.toMap()