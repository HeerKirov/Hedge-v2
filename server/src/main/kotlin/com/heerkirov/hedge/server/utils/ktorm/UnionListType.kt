package com.heerkirov.hedge.server.utils.ktorm

import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.SqlType
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Types

object UnionListType : SqlType<List<String>>(Types.VARCHAR, typeName = "varchar") {
    private const val SPLIT = "|"

    override fun doGetResult(rs: ResultSet, index: Int): List<String>? {
        return rs.getString(index)?.split(SPLIT)?.takeIf { it.isNotEmpty() } ?: emptyList()
    }

    override fun doSetParameter(ps: PreparedStatement, index: Int, parameter: List<String>) {
        ps.setString(index, parameter.joinToString(SPLIT))
    }
}

/**
 * 将字符串数组映射为联合字符串。
 */
fun BaseTable<*>.unionList(name: String): Column<List<String>> {
    return registerColumn(name, UnionListType)
}
