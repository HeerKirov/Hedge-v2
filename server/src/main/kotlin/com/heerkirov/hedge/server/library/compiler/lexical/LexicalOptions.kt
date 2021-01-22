package com.heerkirov.hedge.server.library.compiler.lexical

/**
 * 词法分析器的配置项。
 */
data class LexicalOptions(
    /**
     * 将有限字符串中的下划线转义为空格。
     */
    val translateUnderscoreToSpace: Boolean = false,
    /**
     * 识别并转换中文全角字符。
     */
    val chineseSymbolReflect: Boolean = false
)