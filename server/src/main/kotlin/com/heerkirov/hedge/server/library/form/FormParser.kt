package com.heerkirov.hedge.server.library.form

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.JsonNodeType
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.utils.DateTime.parseDate
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.map
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.parseJsonNode
import io.javalin.http.Context
import java.lang.Exception
import java.lang.IllegalArgumentException
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeParseException
import java.util.*
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.full.isSubclassOf
import kotlin.reflect.full.primaryConstructor

/**
 * 使用自定义的表单解析器来解析表单。
 * 相比于直接使用jackson解析：
 * - 提供了更完备、更符合业务的错误信息反馈。
 * - 提供了更符合需要的注解校验器。
 * - 提供了供给partial update所需的opt选项的解析。
 */
inline fun <reified T : Any> Context.bodyAsForm(): T {
    return mapForm(this.body().parseJsonNode(), T::class)
}

/**
 * 主要作用是在partial update表单中充当存在标示器。当一个字段类型标记为Opt<T>?时，将特殊处理此字段，当找不到此字段的值时，填入Opt::null，否则填入Opt::some。
 */
class Opt<T> {
    private val v: T?
    private val has: Boolean

    constructor(v: T) {
        this.v = v
        this.has = true
    }
    constructor() {
        this.v = null
        this.has = false
    }

    override fun equals(other: Any?) = other is Opt<*> && other.has == this.has && other.v == this.v

    override fun hashCode() = Objects.hash(has, v)

    val isPresent get() = has

    val value: T get() = if(has) {
        @Suppress("UNCHECKED_CAST")
        v as T
    }else throw NullPointerException()

    inline fun <R> unwrap(call: T.() -> R): R = value.call()

    /**
     * 如果值存在，计算一个新值。参数使用this传递。
     */
    inline fun <R> mapOpt(call: T.() -> R): Opt<R> = if(isPresent) Opt(value.call()) else {
        @Suppress("UNCHECKED_CAST")
        this as Opt<R>
    }

    /**
     * 如果值存在，执行一段代码。参数使用this传递。
     */
    inline fun applyOpt(call: T.() -> Unit): Opt<T> {
        value.call()
        return this
    }
}


private val undefined = Opt<Any?>()

//TODO Optimize: 将类型解析的过程提到执行之前，并缓存类型解析信息，供下次复用。

/**
 * 执行将jsonNode转换为任意Object定义的过程。
 * @throws
 * @throws NullPointerException 类型指定为非空，然而获得了空类型
 * @throws ClassCastException 类型转换上遇到了错误
 */
private fun <T : Any> mapAny(jsonNode: JsonNode, kType: KType): Any? {
    @Suppress("UNCHECKED_CAST")
    val kClass = kType.classifier as KClass<*>

    @Suppress("UNCHECKED_CAST")
    return when {
        kClass == Opt::class -> Opt(mapAny<T>(jsonNode, kType.arguments.first().type!!))
        jsonNode.isNull -> {
            if(!kType.isMarkedNullable) throw NullPointerException()
            null
        }
        kClass == List::class || kClass == Set::class -> {
            if(jsonNode.nodeType != JsonNodeType.ARRAY) throw ClassCastException("Excepted type is ${JsonNodeType.ARRAY} but actual type is ${jsonNode.nodeType}.")
            val subType = kType.arguments.first().type!!

            try { jsonNode.map { mapAny<Any>(it, subType) } }catch (e: NullPointerException) {
                throw ClassCastException("Element of array cannot be null.")
            }
        }
        kClass == Map::class -> {
            if(jsonNode.nodeType != JsonNodeType.OBJECT) throw ClassCastException("Excepted type is ${JsonNodeType.OBJECT} but actual type is ${jsonNode.nodeType}.")
            val keyType = kType.arguments[0].type!!
            val valueType = kType.arguments[1].type!!

            try { jsonNode.fields().map { entry -> Pair(mapStringKey(entry.key, keyType), mapAny<Any>(entry.value, valueType)) }.toMap() }catch (e: NullPointerException) {
                throw ClassCastException("Value of object cannot be null.")
            }
        }
        kClass == String::class -> {
            if(jsonNode.nodeType != JsonNodeType.STRING) throw ClassCastException("Excepted type is ${JsonNodeType.STRING} but actual type is ${jsonNode.nodeType}.")
            jsonNode.asText() as T
        }
        kClass == Boolean::class -> {
            if(jsonNode.nodeType != JsonNodeType.BOOLEAN) throw ClassCastException("Excepted type is ${JsonNodeType.BOOLEAN} but actual type is ${jsonNode.nodeType}.")
            jsonNode.asBoolean() as T
        }
        kClass == Int::class -> {
            if(jsonNode.nodeType != JsonNodeType.NUMBER) throw ClassCastException("Excepted type is ${JsonNodeType.NUMBER} but actual type is ${jsonNode.nodeType}.")
            if(!jsonNode.isInt && !jsonNode.isLong) throw ClassCastException("Excepted number type of Int.")
            jsonNode.asInt() as T
        }
        kClass == Long::class -> {
            if(jsonNode.nodeType != JsonNodeType.NUMBER) throw ClassCastException("Excepted type is ${JsonNodeType.NUMBER} but actual type is ${jsonNode.nodeType}.")
            if(!jsonNode.isInt && !jsonNode.isLong) throw ClassCastException("Excepted number type of Long.")
            jsonNode.asLong() as T
        }
        kClass == Double::class -> {
            if(jsonNode.nodeType != JsonNodeType.NUMBER) throw ClassCastException("Excepted type is ${JsonNodeType.NUMBER} but actual type is ${jsonNode.nodeType}.")
            jsonNode.asDouble() as T
        }
        kClass == Float::class -> {
            if(jsonNode.nodeType != JsonNodeType.NUMBER) throw ClassCastException("Excepted type is ${JsonNodeType.NUMBER} but actual type is ${jsonNode.nodeType}.")
            jsonNode.asDouble().toFloat() as T
        }
        kClass == LocalDateTime::class -> {
            if(jsonNode.nodeType != JsonNodeType.STRING) throw ClassCastException("Excepted type is ${JsonNodeType.STRING} but actual type is ${jsonNode.nodeType}.")
            try {
                jsonNode.asText().parseDateTime() as T
            }catch (e: DateTimeParseException) {
                throw ClassCastException(e.message)
            }
        }
        kClass == LocalDate::class -> {
            if(jsonNode.nodeType != JsonNodeType.STRING) throw ClassCastException("Excepted type is ${JsonNodeType.STRING} but actual type is ${jsonNode.nodeType}.")
            try {
                jsonNode.asText().parseDate() as T
            }catch (e: DateTimeParseException) {
                throw ClassCastException(e.message)
            }
        }
        kClass == Any::class -> mapAnyWithoutType(jsonNode)
        kClass.isData -> {
            //提取非空参数，进行递归解析
            if(jsonNode.nodeType != JsonNodeType.OBJECT) throw ClassCastException("Excepted type is ${JsonNodeType.OBJECT} but actual type is ${jsonNode.nodeType}.")
            mapForm(jsonNode, kClass)
        }
        kClass.isSubclassOf(Enum::class) -> {
            if(jsonNode.nodeType != JsonNodeType.STRING) throw ClassCastException("Excepted type is ${JsonNodeType.STRING} but actual type is ${jsonNode.nodeType}.")
            val value = jsonNode.asText()
            val valueOf = kClass.java.getDeclaredMethod("valueOf", String::class.java)
            try {
                valueOf(null, value.toUpperCase())
            }catch (e: Exception) {
                throw ClassCastException("Cannot convert '$value' to enum type ${kClass.simpleName}.")
            }
        }
        else -> throw IllegalArgumentException("Cannot analyse argument of type '$kClass'.")
    }
}

/**
 * 执行将作为map key的string类型按照kType定义转换为任意object的过程。
 */
private fun mapStringKey(string: String, kType: KType): Any? {
    @Suppress("UNCHECKED_CAST")
    val kClass = kType.classifier as KClass<*>
    @Suppress("UNCHECKED_CAST")
    return when {
        kClass == String::class -> string
        kClass == Int::class -> string.toIntOrNull() ?: throw ClassCastException("Expected number type of Int.")
        kClass == Long::class -> string.toLongOrNull() ?: throw ClassCastException("Expected number type of Long.")
        kClass == Float::class -> string.toFloatOrNull() ?: throw ClassCastException("Expected number type of Float.")
        kClass == Double::class -> string.toDoubleOrNull() ?: throw ClassCastException("Expected number type of Double.")
        kClass == Boolean::class -> string.toBoolean()
        kClass == LocalDateTime::class -> {
            try {
                string.parseDateTime()
            }catch (e: DateTimeParseException) {
                throw ClassCastException(e.message)
            }
        }
        kClass == LocalDate::class -> {
            try {
                string.parseDate()
            }catch (e: DateTimeParseException) {
                throw ClassCastException(e.message)
            }
        }
        kClass.isSubclassOf(Enum::class) -> {
            val valueOf = kClass.java.getDeclaredMethod("valueOf", String::class.java)
            try {
                valueOf(null, string.toUpperCase())
            }catch (e: Exception) {
                throw ClassCastException("Cannot convert '$string' to enum type ${kClass.simpleName}.")
            }
        }
        else -> throw IllegalArgumentException("Cannot analyse argument of type '$kClass'.")
    }
}

/**
 * 执行将任意jsonNode在未知类型情况下自动转换为object的过程。
 */
private fun mapAnyWithoutType(jsonNode: JsonNode): Any {
    return when(jsonNode.nodeType) {
        JsonNodeType.NUMBER -> if(jsonNode.isInt || jsonNode.isLong) {
            jsonNode.asInt()
        }else{
            jsonNode.asDouble()
        }
        JsonNodeType.STRING -> jsonNode.asText()
        JsonNodeType.BOOLEAN -> jsonNode.asBoolean()
        JsonNodeType.ARRAY -> jsonNode.parseJSONObject()
        JsonNodeType.OBJECT -> jsonNode.parseJSONObject()
        else -> throw ClassCastException("Cannot parse type ${jsonNode.nodeType}.")
    }
}

/**
 * 执行将jsonNode转换为Form定义的Object的过程。
 */
fun <T : Any> mapForm(jsonNode: JsonNode, formClass: KClass<T>): T {
    val constructor = formClass.primaryConstructor!!

    val args = constructor.parameters.mapNotNull { parameter ->
        val optional = parameter.isOptional
        val name = parameter.name!!

        when {
            //form中包含对此field的定义，将其提取出来
            jsonNode.has(name) -> {
                val node = jsonNode.get(name)
                val value = try {
                    mapAny<Any>(node, parameter.type)
                }catch (e: ClassCastException) {
                    throw ParamTypeError(name, e.message?.let { "type cast error: $it" } ?: "type cast failed.")
                }catch (e: NullPointerException) {
                    throw ParamTypeError(name, "cannot be null.")
                }

                if(value != null) {
                    try {
                        if(value is Opt<*>) {
                            analyseValidation(parameter.annotations, value.value as Any)
                        }else{
                            analyseValidation(parameter.annotations, value)
                        }
                    }catch (e: Exception) {
                        throw ParamTypeError(name, e.message ?: "validation failed.")
                    }
                }

                Pair(parameter, value)
            }
            //form中不包含field的定义，但是参数定义表示此field可选
            optional -> null
            //不包含定义且必选
            else -> if(parameter.type.classifier == Opt::class) {
                //Opt类型会自动解析为undefined值
                Pair(parameter, undefined)
            }else{
                throw ParamRequired(name)
            }
        }
    }.toMap()

    return constructor.callBy(args)
}

/**
 * 解析附带的validation检验注解，并执行检验。
 */
private fun analyseValidation(annotations: List<Annotation>, value: Any) {
    if(value is String) {
        (annotations.firstOrNull { it is NotBlank } as NotBlank?)?.let {
            if(value.isBlank()) throw Exception("cannot be blank.")
        }
        (annotations.firstOrNull { it is Length } as Length?)?.let {
            if(value.length > it.value) throw Exception("cannot longer than ${value.length}.")
        }
    }else if(value is Number) {
        val i = value.toInt()
        (annotations.firstOrNull { it is Range } as Range?)?.let {
            if(i > it.max || i < it.min) throw Exception("must be in range [${it.min}, ${it.max}].")
        }
        (annotations.firstOrNull { it is Min } as Min?)?.let {
            if(i < it.value) throw Exception("must be greater than ${it.value}.")
        }
    }
}