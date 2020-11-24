package com.heerkirov.hedge.server.utils

/**
 * 提供一套利用二进制数字做组合的工具类。
 * 它实质上是一个二进制整数的代理，能够将二进制整数解析为目标类型的组合值，或者将目标类型转换至二进制。
 * @param T 实现CompositionOperator接口，将此值转换为一个二进制数字。
 */
class BinaryComposition<T : BinaryComposition.CompositionOperator> {
    val binary: Int

    constructor(binary: Int) {
        this.binary = binary
    }
    constructor(vararg values: T) {
        var binary = 0
        for (value in values) {
            binary = binary or value.binary
        }
        this.binary = binary
    }

    operator fun contains(value: T): Boolean {
        return binary and value.binary != 0
    }

    fun containsAny(vararg values: T): Boolean {
        var binary = 0
        for (value in values) {
            binary = binary or value.binary
        }
        return binary and this.binary != 0
    }

    interface CompositionOperator {
        val binary: Int
    }
}