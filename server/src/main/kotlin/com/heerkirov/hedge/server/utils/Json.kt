package com.heerkirov.hedge.server.utils

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper


private val objectMapper = jacksonObjectMapper().configure(DeserializationFeature.FAIL_ON_IGNORED_PROPERTIES, false)

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

fun <T> T.toJsonNode(): JsonNode {
    return objectMapper.valueToTree(this)
}

inline fun <reified T> JsonNode.parseJSONObject(): T {
    return objectMapper().convertValue(this, T::class.java)
}

fun String.parseJsonNode(): JsonNode {
    return objectMapper.readTree(this)
}
