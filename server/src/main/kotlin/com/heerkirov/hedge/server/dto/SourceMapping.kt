package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.enums.MetaType

data class SourceMappingBatchQueryForm(val source: String, val tagNames: List<String>)

data class SourceMappingBatchQueryResult(val source: String, val tagName: String, val mappings: List<SourceMappingTargetItem>)

data class SourceMappingTargetItem(val metaType: MetaType, val metaId: Int)

data class SourceMappingMetaItem(val source: String, val name: String, val displayName: String?, val type: String?)