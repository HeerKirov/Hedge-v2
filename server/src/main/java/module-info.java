module com.heerkirov.hedge.server {
    requires java.base;
    requires java.sql;
    requires kotlin.stdlib;
    requires kotlin.reflect;
    requires com.fasterxml.jackson.databind;
    requires jackson.module.kotlin;
    requires sqlite.jdbc;
    requires ktorm.core;
    requires ktorm.support.sqlite;
}