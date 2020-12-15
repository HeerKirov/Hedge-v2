package com.heerkirov.hedge.server.components.database

data class Metadata(
    val source: SourceOption
)

data class SourceOption(
    val sites: MutableList<SiteItem>
) {
    data class SiteItem(val name: String, var title: String, val hasId: Boolean, val hasSecondaryId: Boolean)
}