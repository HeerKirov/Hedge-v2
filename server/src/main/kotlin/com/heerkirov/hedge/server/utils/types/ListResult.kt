package com.heerkirov.hedge.server.utils.types

import com.heerkirov.hedge.server.form.ErrorResult
import me.liuwj.ktorm.dsl.Query
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.dsl.map

data class ListResult<T>(val total: Int, val result: List<T>)

inline fun <T> Query.toListResult(transform: (QueryRowSet) -> T): ListResult<T> {
    return ListResult(this.totalRecords, this.map(transform))
}

fun <T, R> ListResult<T>.map(transform: (T) -> R): ListResult<R> {
    return ListResult(this.total, this.result.map(transform))
}

data class QueryResult<T>(val total: Int, val result: List<T>, val warnings: List<ErrorResult>)

inline fun <T> Query.toQueryResult(warnings: List<ErrorResult>, transform: (QueryRowSet) -> T): QueryResult<T> {
    return QueryResult(this.totalRecords, this.map(transform), warnings)
}