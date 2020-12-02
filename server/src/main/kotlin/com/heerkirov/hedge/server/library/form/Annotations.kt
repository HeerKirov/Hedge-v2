package com.heerkirov.hedge.server.library.form

/**
 * Valid注解：此String字段必须非空
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class NotBlank

/**
 * Valid注解：此String字段不可超出最大长度
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class Length(val value: Int)

/**
 * Valid注解：此Number字段值必须位于指定范围内
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class Range(val min: Int, val max: Int)

/**
 * Valid注解：此Number字段值必须不小于指定值
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class Min(val value: Int)
