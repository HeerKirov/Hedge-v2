package com.heerkirov.hedge.server.utils.ktorm

import com.heerkirov.hedge.server.utils.Composition
import com.heerkirov.hedge.server.utils.CompositionGenerator
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.SqlType
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