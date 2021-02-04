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
    requires java.desktop;
    requires jave.core;
    requires org.slf4j;
    requires dd.plist;

    opens com.heerkirov.hedge.server.components.health;
    opens com.heerkirov.hedge.server.components.appdata;
    opens com.heerkirov.hedge.server.components.database;
    opens com.heerkirov.hedge.server.components.http;
    opens com.heerkirov.hedge.server.components.http.modules;
    opens com.heerkirov.hedge.server.components.http.routes;
    opens com.heerkirov.hedge.server.model.source;
    opens com.heerkirov.hedge.server.model.album;
    opens com.heerkirov.hedge.server.model.collection;
    opens com.heerkirov.hedge.server.model.meta;
    opens com.heerkirov.hedge.server.model.illust;
    opens com.heerkirov.hedge.server.model.system;
    opens com.heerkirov.hedge.server.form;
    opens com.heerkirov.hedge.server.exceptions;
    opens com.heerkirov.hedge.server.utils.types;
    exports com.heerkirov.hedge.server.library.compiler.grammar.semantic to kotlin.reflect;
}