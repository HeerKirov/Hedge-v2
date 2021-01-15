package com.heerkirov.hedge.server.library.compiler.lexical

internal val singleSymbols = arrayOf(
    '|', '/', '&', '-', '+',
    '>', '<', ':', '~',
    '[', ']', '(', ')', '{', '}',
    '@', '#', '$', '^', '!', '.', ','
)

internal val doubleSymbols = arrayOf(
    ">=", "<=", "--", "++"
)

internal val spaceSymbols = arrayOf(
    ' ', '\n', '\r', '\t'
)

internal val stringSymbols = mapOf(
    '\'' to CharSequenceType.APOSTROPHE,
    '"' to CharSequenceType.DOUBLE_QUOTES,
    '`' to CharSequenceType.BACKTICKS
)

internal val escapeSymbols = mapOf(
    'n' to '\n',
    't' to '\t',
    'r' to '\r',
    '"' to '"',
    '`' to '`',
    '\'' to '\'',
    '\\' to '\\'
)

internal val doubleSymbolsMap = doubleSymbols.asSequence().groupBy({ it[0] }) { it[1] }

internal val stringSymbolsReflect = stringSymbols.asSequence().map { it.value to it.key }.toMap()