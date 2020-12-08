package com.heerkirov.hedge.server.utils.ktorm

import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.utils.types.OrderItem
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.expression.OrderByExpression
import me.liuwj.ktorm.schema.ColumnDeclaring


/**
 * 提供一个工具类，方便地将在filter order属性中string定义的列转换为Ktorm列，并快速提取。
 */
class OrderTranslator(private val orderFieldName: String = "order", initializer: Builder.() -> Unit) {
    private val map: HashMap<String, ColumnDefinition> = hashMapOf()

    init { initializer(Builder()) }

    inner class Builder {
        val first = NullDefinition.FIRST
        val last = NullDefinition.LAST

        infix fun String.to(column: ColumnDeclaring<*>): ColumnDefinition {
            val columnDefinition = ColumnDefinition(column)
            map[this] = columnDefinition
            return columnDefinition
        }
        infix fun ColumnDefinition.nulls(nullDefinition: NullDefinition) {
            this.nullDefinition = nullDefinition
        }
    }

    enum class NullDefinition {
        FIRST, LAST
    }

    inner class ColumnDefinition(val column: ColumnDeclaring<*>) {
        var nullDefinition: NullDefinition? = null
    }

    operator fun get(field: String, direction: Int): OrderByExpression {
        val column = map[field] ?: throw ParamTypeError(orderFieldName, "cannot accept value '$field'.")
        return if(direction > 0) {
            column.column.asc()
        }else{
            column.column.desc()
        }
    }

    fun orderFor(orders: List<OrderItem>): Array<OrderByExpression> {
        return orders.flatMap {
            val column = map[it.name] ?: throw ParamTypeError(orderFieldName, "cannot accept value '${it.name}'.")
            val orderByExpression = if(it.desc) {
                column.column.desc()
            }else{
                column.column.asc()
            }
            if(column.nullDefinition != null) {
                arrayListOf(column.column.isNull().asc(), orderByExpression)
            }else{
                arrayListOf(orderByExpression)
            }
        }.toTypedArray()
    }
}

fun Query.orderBy(orders: List<OrderItem>, translator: OrderTranslator): Query {
    return this.orderBy(*translator.orderFor(orders))
}