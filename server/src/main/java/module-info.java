module com.heerkirov.hedge.server {
    requires java.base;
    requires java.sql;
    requires kotlin.stdlib;
    requires kotlin.reflect;

    requires io.javalin;
    requires ktorm.core;
    requires ktorm.support.sqlite;
    requires sqlite.jdbc;
    requires com.fasterxml.jackson.databind;
    requires jackson.module.kotlin;
}