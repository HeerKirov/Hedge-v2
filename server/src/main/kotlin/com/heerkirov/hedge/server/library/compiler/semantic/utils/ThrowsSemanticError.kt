package com.heerkirov.hedge.server.library.compiler.semantic.utils

import com.heerkirov.hedge.server.library.compiler.utils.SemanticError

/**
 * 在语义分析中，将语义编译错误通过Exception抛出每一个处理作用域。
 */
class ThrowsSemanticError(val errors: Array<out SemanticError<*>>) : Exception("Uncaught semantic error.")

fun semanticError(vararg error: SemanticError<*>): Nothing {
    throw ThrowsSemanticError(error)
}

//TODO 提出更好的生成错误的方法。通过异常传递错误的方式只能传递error，无法传递warning。