package com.heerkirov.hedge.server.utils.ktorm

import com.fasterxml.jackson.core.type.TypeReference
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.toJSONString
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.Column
import me.liuwj.ktorm.schema.SqlType
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Types

class JsonType<T: Any>(private val typeReference: TypeReference<T>) : SqlType<T>(Types.OTHER, typeName = "jsonb") {
    override fun doGetResult(rs: ResultSet, index: Int): T? {
        val s = rs.getString(index)
        return if(s.isNullOrBlank()) {
            null
        }else{
            s.parseJSONObject(typeReference)
        }
    }

    override fun doSetParameter(ps: PreparedStatement, index: Int, parameter: T) {
        ps.setObject(index, parameter.toJSONString(), Types.OTHER)
    }
}

fun <E: Any, C: Any> BaseTable<E>.json(name: String, typeReference: TypeReference<C>): Column<C> {
    return registerColumn(name, JsonType(typeReference))
}