module com.heerkirov.hedge.server {
    requires java.base;
    requires java.sql;
    requires kotlin.stdlib;
    requires kotlin.reflect;
    requires kotlin.stdlib.jdk7;

    requires io.javalin;
    requires ktorm.core;
    requires ktorm.support.sqlite;
    requires sqlite.jdbc;
    requires com.fasterxml.jackson.databind;
    requires jackson.module.kotlin;

    requires org.slf4j;

    opens com.heerkirov.hedge.server.components.health;
    opens com.heerkirov.hedge.server.components.appdata;
    opens com.heerkirov.hedge.server.components.database;
    opens com.heerkirov.hedge.server.components.http.modules;
    opens com.heerkirov.hedge.server.components.http.routes;
}