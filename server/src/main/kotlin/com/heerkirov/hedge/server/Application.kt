package com.heerkirov.hedge.server

import me.liuwj.ktorm.database.Database
import me.liuwj.ktorm.dsl.forEach
import me.liuwj.ktorm.dsl.from
import me.liuwj.ktorm.dsl.insert
import me.liuwj.ktorm.dsl.select
import me.liuwj.ktorm.schema.Table
import me.liuwj.ktorm.schema.int
import me.liuwj.ktorm.schema.varchar

object C : Table<Nothing>("c") {
    val name = varchar("name")
    val age = int("age")
}

fun main() {
    val db = Database.connect(
        url = "jdbc:sqlite:test.db",
        driver = "org.sqlite.JDBC"
    )

    db.useConnection { conn ->
        conn.prepareStatement("CREATE TABLE IF NOT EXISTS c(name VARCHAR(128) NOT NULL, age INT NOT NULL)").execute()

        db.insert(C) {
            set(C.name, "A")
            set(C.age, 18)
        }

        db.from(C).select(C.name, C.age).forEach {
            println("name=${it[C.name]!!}, age=${it[C.age]!!}")
        }
    }
}