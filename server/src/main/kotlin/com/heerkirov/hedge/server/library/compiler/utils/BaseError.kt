package com.heerkirov.hedge.server.library.compiler.utils

/**
 * 编译错误。
 */
abstract class CompileError(val code: Int, val message: String, val happenPosition: IndexRange)

/**
 * 词法分析错误。词法分析系列的code范围为1000~1999。
 */
abstract class LexicalError(code: Int, message: String, happenPositionIndex: IndexRange) : CompileError(code, message, happenPositionIndex)

/**
 * 语法分析错误。语法分析系列的code范围为2000~2999。
 */
abstract class GrammarError(code: Int, message: String, happenPositionIndex: IndexRange) : CompileError(code, message, happenPositionIndex)

