package com.heerkirov.hedge.server.utils

object Net {
    /**
     * 解析一段port范围。
     * @param port 例如"8080, 8090-9000"这样的端口范围
     * @return 可用端口的迭代器
     */
    fun analyzePort(port: String): Sequence<Int> {
        return port.split(",")
            .asSequence()
            .map { s -> s.split("-").map { it.toInt() } }
            .flatMap { s ->
                when (s.size) {
                    0 -> sequenceOf()
                    1 -> sequenceOf(s[0])
                    else -> sequence {
                        for(i in s[0] until s[s.size - 1]) {
                            yield(i)
                        }
                    }
                }
            }
    }

    /**
     * 从一个起始port开始迭代端口。
     * @param begin 起始端口
     * @param step 迭代步长
     */
    fun generatePort(begin: Int, step: Int = 10): Sequence<Int> {
        return sequence {
            for(i in begin .. 65535 step step) {
                yield(i)
            }
        }
    }
}