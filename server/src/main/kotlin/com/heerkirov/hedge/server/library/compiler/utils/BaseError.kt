package com.heerkirov.hedge.server.library.compiler.utils

/**
 * 编译错误。
 */
abstract class CompileError(val code: Int, val message: String, val happenPosition: IndexRange) {
    override fun equals(other: Any?): Boolean {
        return other === this || (other is CompileError && other.code == this.code && other.message == this.message && other.happenPosition == this.happenPosition)
    }

    override fun hashCode(): Int {
        var result = code
        result = 31 * result + message.hashCode()
        result = 31 * result + happenPosition.hashCode()
        return result
    }

    override fun toString(): String {
        return "${this::class.simpleName}[$code](At $happenPosition)$message "
    }
}

/**
 * 词法分析错误。词法分析系列的code范围为1000~1999。
 */
abstract class LexicalError(code: Int, message: String, happenPositionIndex: IndexRange) : CompileError(code, message, happenPositionIndex)

/**
 * 语法分析错误。语法分析系列的code范围为2000~2999。
 */
abstract class GrammarError(code: Int, message: String, happenPositionIndex: IndexRange) : CompileError(code, message, happenPositionIndex)

