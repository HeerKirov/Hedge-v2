package com.heerkirov.hedge.server.utils.ktorm

import com.heerkirov.hedge.server.utils.Composition
import me.liuwj.ktorm.expression.ArgumentExpression
import me.liuwj.ktorm.expression.ScalarExpression
import me.liuwj.ktorm.schema.BooleanSqlType
import me.liuwj.ktorm.schema.ColumnDeclaring
import me.liuwj.ktorm.schema.SqlType
import me.liuwj.ktorm.schema.VarcharSqlType


data class CompositionContainExpression<T : Composition<T>>(
    val left: ScalarExpression<T>,
    val right: ScalarExpression<T>,
    override val sqlType: SqlType<Boolean> = BooleanSqlType,
    override val isLeafNode: Boolean = false,
    override val extraProperties: Map<String, Any> = emptyMap()
) : ScalarExpression<Boolean>()

inline infix fun <reified T : Composition<T>> ColumnDeclaring<T>.compositionContains(argument: T): CompositionContainExpression<T> {
    return CompositionContainExpression(asExpression(), ArgumentExpression(argument, CompositionType(T::class)))
}

data class EscapeExpression(
    val left: ScalarExpression<String>,
    val argument: ArgumentExpression<String>,
    val escape: ArgumentExpression<String>,
    override val sqlType: SqlType<Boolean> = BooleanSqlType,
    override val isLeafNode: Boolean = false,
    override val extraProperties: Map<String, Any> = emptyMap()
) : ScalarExpression<Boolean>()

infix fun ColumnDeclaring<String>.escapeLike(argument: String): ScalarExpression<Boolean> {
    return EscapeExpression(asExpression(), ArgumentExpression(argument, VarcharSqlType), ArgumentExpression("\\", VarcharSqlType))
}