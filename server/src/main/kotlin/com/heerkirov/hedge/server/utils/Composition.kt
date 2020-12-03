package com.heerkirov.hedge.server.utils

import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.KClass
import kotlin.reflect.KFunction
import kotlin.reflect.full.companionObject
import kotlin.reflect.full.companionObjectInstance
import kotlin.reflect.full.declaredMemberProperties

abstract class Composition<T : Composition<T>>(clazz: KClass<T>, val value: Int) {
    private val newInstance: (Int) -> T by lazy { { CompositionGenerator.getGenerator(clazz).newInstance(it) } }

    operator fun plus(target: Composition<T>): T = newInstance(value or target.value)

    operator fun contains(element: Composition<T>): Boolean = element.value and value.inv() == 0

    override fun equals(other: Any?) = if(other is Composition<*>) other.value == value else false

    override fun hashCode() = value

    override fun toString() = this::class.simpleName!!
}

fun <T : Composition<T>> compositionConstructorOf(clazz: KClass<T>): (Int) -> T {
    val caches: MutableMap<Int, T> = ConcurrentHashMap()

    for (constructor in clazz.constructors) {
        val parameters = constructor.parameters
        if(parameters.size == 1 && parameters[0].type.classifier == Int::class) {
            return { caches[it] ?: constructor.call(it).also { v -> caches[it] = v } }
        }
    }
    throw ReflectiveOperationException("Type ${clazz.qualifiedName} not have constructor(Int).")
}

/**
 * 从组合中，按照给定的元素列表进行过滤。
 */
fun <T : Composition<T>> T.filterAs(elements: Iterable<T>): List<T> {
    return elements.filter { this.contains(it) }
}

/**
 * 从组合中，按照给定的元素列表进行过滤。
 */
fun <T : Composition<T>> T.filterAsSequence(elements: Iterable<T>): Sequence<T> {
    return elements.asSequence().filter { this.contains(it) }
}

/**
 * 将给定的全部元素组合成一个元素，相当于连加。
 * @throws NullPointerException 如果没有元素，会抛出一个NPE。
 */
inline fun <reified T : Composition<T>> Iterable<T>.union() : T {
    var base: Int? = null
    for (element in this) {
        base = if(base == null) element.value else base or element.value
    }
    return CompositionGenerator.getGenerator(T::class).newInstance(base!!)
}

/**
 * 将一个字符串转换为给定组合类型中的基本或导出元素。
 * @throws NoSuchElementException 此元素不存在时抛出此错误
 */
inline fun <reified T : Composition<T>> compositionOf(str: String): T {
    val generator = CompositionGenerator.getGenerator(T::class)
    return generator.parse(str) ?: throw NoSuchElementException()
}

/**
 * 将一个组合元素拆解为一系列的基本元素。基本元素是不可再分的元素，每一个元素占有一个bit。
 */
inline fun <reified T : Composition<T>> T.toBaseElements(): List<T> {
    val generator = CompositionGenerator.getGenerator(T::class)
    return this.filterAs(generator.baseElements)
}

/**
 * 将一个组合元素拆解为一系列的基本元素和导出元素。
 * 导出元素是有标记名称的、由几项基本元素组合而成的元素，且多个组合元素之间的覆盖面不重叠。当满足导出元素时，不再生成对应部分的基本元素。
 */
inline fun <reified T : Composition<T>> T.toExportedElements(): List<T> {
    val generator = CompositionGenerator.getGenerator(T::class)

    var leaveValue = this.value
    return generator.exportedElements.filter {
        //判断leave value是否包含此element
        if(it.value and leaveValue.inv() == 0) {
            //用反码从leave value中消去此element
            leaveValue = leaveValue and it.value.inv()
            true
        }else false
    } + generator.baseElements.filter {
        //判断leave value是否包含此element
        if(it.value and leaveValue.inv() == 0) {
            //用反码从leave value中消去此element
            leaveValue = leaveValue and it.value.inv()
            true
        }else false
    }
}

class CompositionGenerator<T : Composition<T>>(clazz: KClass<T>) {
    companion object {
        private val cache: MutableMap<KClass<out Composition<*>>, CompositionGenerator<*>> = ConcurrentHashMap()

        fun <T : Composition<T>> getGenerator(clazz: KClass<T>): CompositionGenerator<T> {
            var result = cache[clazz]
            if(result == null) {
                synchronized(this) {
                    result = cache[clazz]
                    if(result == null) {
                        result = CompositionGenerator(clazz)
                    }
                }
            }
            @Suppress("UNCHECKED_CAST")
            return result as CompositionGenerator<T>
        }
    }

    private val typeConstructor: KFunction<T> = getTypePrimaryConstructor(clazz)
    private val instanceCache: ConcurrentHashMap<Int, T> = ConcurrentHashMap()

    val baseElements: List<T> = getTypeDeclaredElements(clazz, "baseElements")
    val exportedElements: List<T> = getTypeDeclaredElements(clazz, "exportedElements")

    private val dictOfName: Map<String, T> = (baseElements.asSequence().map { Pair(it.toString(), it) } + exportedElements.asSequence().map { Pair(it.toString(), it) }).toMap()

    fun parse(str: String): T? {
        return dictOfName[str]
    }

    fun newInstance(value: Int): T {
        return instanceCache.computeIfAbsent(value) { typeConstructor.call(it) }
    }

    private fun getTypePrimaryConstructor(clazz: KClass<T>): KFunction<T> {
        for (constructor in clazz.constructors) {
            val parameters = constructor.parameters
            if(parameters.size == 1 && parameters[0].type.classifier == Int::class) {
                return constructor
            }
        }
        throw ReflectiveOperationException("Type ${clazz.qualifiedName} not have constructor(Int).")
    }

    private fun getTypeDeclaredElements(clazz: KClass<T>, name: String): List<T> {
        val properties = clazz.companionObject!!.declaredMemberProperties.firstOrNull { it.name == name }
        return if(properties != null) {
            @Suppress("UNCHECKED_CAST")
            properties.getter.call(clazz.companionObjectInstance) as List<T>
        }else{
            emptyList()
        }
    }
}