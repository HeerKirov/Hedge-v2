package com.heerkirov.hedge.server.utils.ktorm

import com.fasterxml.jackson.databind.JavaType
import com.heerkirov.hedge.server.utils.objectMapper
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.toJSONString
import org.ktorm.schema.BaseTable
import org.ktorm.schema.Column
import org.ktorm.schema.SqlType
import org.ktorm.schema.TypeReference
import java.lang.reflect.Type
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Types

class JsonType<T: Any>(type: Type) : SqlType<T>(Types.OTHER, typeName = "jsonb") {
    private val javaType: JavaType = objectMapper().constructType(type)

    override fun doGetResult(rs: ResultSet, index: Int): T? {
        val s = rs.getString(index)
        return if(s.isNullOrBlank()) {
            null
        }else{
            s.parseJSONObject(javaType)
        }
    }

    override fun doSetParameter(ps: PreparedStatement, index: Int, parameter: T) {
        ps.setObject(index, parameter.toJSONString(), Types.OTHER)
    }
}

fun <E: Any, C: Any> BaseTable<E>.json(name: String, typeReference: TypeReference<C>): Column<C> {
    return registerColumn(name, JsonType(typeReference.referencedType))
}