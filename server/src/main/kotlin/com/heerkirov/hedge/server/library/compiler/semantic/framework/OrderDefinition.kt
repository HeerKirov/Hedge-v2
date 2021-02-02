package com.heerkirov.hedge.server.library.compiler.semantic.framework

import com.heerkirov.hedge.server.library.compiler.semantic.utils.Alias
import com.heerkirov.hedge.server.library.compiler.semantic.utils.AliasBuilder
import com.heerkirov.hedge.server.library.compiler.semantic.utils.AliasDefinition
import com.heerkirov.hedge.server.library.compiler.semantic.utils.buildAlias
import kotlin.reflect.KClass


/**
 * 排序列表定义。
 */
class OrderDefinition<T : Enum<T>>(private val clazz: KClass<T>, private val items: List<AliasDefinition<T, Alias>>) {
    /**
     * 从[^]name映射到对应的项。
     */
    private val aliasMap: Map<String, AliasDefinition<T, Alias>> = mutableMapOf<String, AliasDefinition<T, Alias>>().also { aliasMap ->
        for (item in items) {
            for (alias in item.alias) {
                val aliasName = alias.toString()
                if(aliasName in aliasMap) throw RuntimeException("Order item alias $aliasName is duplicated.")
                aliasMap[aliasName] = item
            }
        }
    }
}

/**
 * 定义一个排序列表。
 */
inline fun <reified T : Enum<T>> orderListOf(block: AliasBuilder<T, Alias>.() -> Unit): OrderDefinition<T> {
    return OrderDefinition(T::class, buildAlias({ if(it.startsWith("^")) Alias(it.substring(1), true) else Alias(it, false) }, block))
}

//TODO 对order也使用生成器拆分，把生成代码从核心代码解耦出来