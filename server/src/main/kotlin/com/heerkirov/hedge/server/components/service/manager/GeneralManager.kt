package com.heerkirov.hedge.server.components.service.manager

object GeneralManager {
    /**
     * 检查命名是否符合要求。
     */
    fun checkTagName(name: String): Boolean {
        //检查name是否符合规范。

        //不能不包含非空字符
        if(name.isBlank()) {
            return false
        }

        //不能包含禁用符号' " ` . |
        for (c in disableCharacter) {
            if(name.contains(c)) {
                return false
            }
        }
        return true
    }

    private val disableCharacter = arrayOf('\'', '"', '`', '.', '|')
}