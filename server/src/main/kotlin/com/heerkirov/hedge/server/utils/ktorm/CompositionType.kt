package com.heerkirov.hedge.server.utils.ktorm

import com.heerkirov.hedge.server.utils.Composition
import com.heerkirov.hedge.server.utils.CompositionGenerator
import me.liuwj.ktorm.expression.ArgumentExpression
import me.liuwj.ktorm.expression.ScalarExpression
import me.liuwj.ktorm.schema.*
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Types
import kotlin.reflect.KClass

class CompositionType<T : Composition<T>>(clazz: KClass<T>) : SqlType<T>(Types.INTEGER, "integer") {
    private val newInstance: (Int) -> T by lazy { { CompositionGenerator.getGenerator(clazz).newInstance(it) } }

    override fun doGetResult(rs: ResultSet, index: Int): T {
        val value = rs.getInt(index)
        return newInstance(value)
    }

    override fun doSetParameter(ps: PreparedStatement, index: Int, parameter: T) {
        ps.setInt(index, parameter.value)
    }
}

inline fun <reified C: Composition<C>> BaseTable<*>.composition(name: String): Column<C> {
    return registerColumn(name, CompositionType(C::class))
}

data class CompositionContainExpression<T : Composition<T>>(
    val left: ScalarExpression<T>,
    val right: ScalarExpression<T>,
    override val sqlType: SqlType<Boolean> = BooleanSqlType,
    override val isLeafNode: Boolean = false,
    override val extraProperties: Map<String, Any> = emptyMap()
) : ScalarExpression<Boolean>()

inline infix fun <reified T : Composition<T>> ColumnDeclaring<T>.contains(argument: T): CompositionContainExpression<T> {
    return CompositionContainExpression(asExpression(), ArgumentExpression(argument, CompositionType(T::class)))
}