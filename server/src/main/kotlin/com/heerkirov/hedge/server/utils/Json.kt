package com.heerkirov.hedge.server.utils

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.DateTime.toDateTimeString
import java.time.LocalDateTime


private val objectMapper = jacksonObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_IGNORED_PROPERTIES, false)
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
    .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false)
    .registerModule(SimpleModule().also {
        it.addSerializer(LocalDateTime::class.java, LocalDateTimeSerializer())
        it.addDeserializer(LocalDateTime::class.java, LocalDateTimeDeserializer())
    })


fun objectMapper(): ObjectMapper = objectMapper

fun <T> T.toJSONString(): String {
    return objectMapper.writeValueAsString(this)
}

inline fun <reified T> String.parseJSONObject(): T {
    return objectMapper().readValue(this, T::class.java)
}

fun <T> String.parseJSONObject(clazz: Class<T>): T {
    return objectMapper().readValue(this, clazz)
}

fun <T> String.parseJSONObject(typeReference: TypeReference<T>): T {
    return objectMapper().readValue(this, typeReference)
}

fun <T> String.parseJSONObject(javaType: JavaType): T {
    return objectMapper().readValue(this, javaType)
}

fun <T> T.toJsonNode(): JsonNode {
    return objectMapper.valueToTree(this)
}

inline fun <reified T> JsonNode.parseJSONObject(): T {
    return objectMapper().convertValue(this, T::class.java)
}

fun <T> JsonNode.parseJSONObject(clazz: Class<T>): T {
    return objectMapper().convertValue(this, clazz)
}

fun String.parseJsonNode(): JsonNode {
    return objectMapper.readTree(this)
}

class LocalDateTimeSerializer : JsonSerializer<LocalDateTime>() {
    override fun serialize(localDateTime: LocalDateTime, jsonGenerator: JsonGenerator, serializerProvider: SerializerProvider) {
        jsonGenerator.writeString(localDateTime.toDateTimeString())
    }
}

class LocalDateTimeDeserializer : JsonDeserializer<LocalDateTime>() {
    override fun deserialize(jsonParser: JsonParser, context: DeserializationContext?): LocalDateTime {
        return jsonParser.text.parseDateTime()
    }
}