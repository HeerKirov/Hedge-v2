package com.heerkirov.hedge.server.components.database

data class Storage(
    val tagExporter: TagExporter
)

data class TagExporter(
    var refreshGlobalOrdinal: Boolean
)