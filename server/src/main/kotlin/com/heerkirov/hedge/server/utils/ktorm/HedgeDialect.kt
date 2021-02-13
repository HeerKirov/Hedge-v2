package com.heerkirov.hedge.server.utils.ktorm

import me.liuwj.ktorm.database.Database
import me.liuwj.ktorm.expression.SqlExpression
import me.liuwj.ktorm.expression.SqlFormatter
import me.liuwj.ktorm.support.sqlite.SQLiteDialect
import me.liuwj.ktorm.support.sqlite.SQLiteFormatter

class HedgeDialect : SQLiteDialect() {
    override fun createSqlFormatter(database: Database, beautifySql: Boolean, indentSize: Int): SqlFormatter {
        return HedgeSqlFormatter(database, beautifySql, indentSize)
    }
}

class HedgeSqlFormatter(database: Database, beautifySql: Boolean, indentSize: Int) : SQLiteFormatter(database, beautifySql, indentSize) {
    override fun visitUnknown(expr: SqlExpression): SqlExpression {
        return when (expr) {
            is CompositionContainExpression<*> -> {
                write("(")
                if(expr.left.removeBrackets) {
                    write("~ "); visit(expr.left)
                }else{
                    write("(~ "); visit(expr.left); removeLastBlank(); write(") ")
                }
                write("& ")

                if(expr.right.removeBrackets) {
                    visit(expr.right)
                }else{
                    write("("); visit(expr.right); removeLastBlank(); write(") ")
                }
                write(")=0 ")

                expr
            }
            is CompositionAnyExpression<*> -> {
                write("(")
                if(expr.left.removeBrackets) {
                    visit(expr.left)
                }else{
                    write("( "); visit(expr.left); removeLastBlank(); write(") ")
                }
                write("& ")

                if(expr.right.removeBrackets) {
                    visit(expr.right)
                }else{
                    write("("); visit(expr.right); removeLastBlank(); write(") ")
                }
                write(")<>0 ")

                expr
            }
            is EscapeExpression -> {
                if(expr.left.removeBrackets) {
                    visit(expr.left)
                }else{
                    write("("); visit(expr.left); removeLastBlank(); write(") ")
                }
                write("like ")
                if (expr.argument.removeBrackets) {
                    visit(expr.argument)
                } else {
                    write("("); visit(expr.argument); removeLastBlank(); write(") ")
                }
                write("escape ")
                if (expr.escape.removeBrackets) {
                    visit(expr.escape)
                } else {
                    write("("); visit(expr.escape); removeLastBlank(); write(") ")
                }

                expr
            }
            else -> {
                super.visitUnknown(expr)
            }
        }
    }
}