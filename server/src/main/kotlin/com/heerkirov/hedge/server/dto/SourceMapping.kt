package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.utils.types.Opt

data class SourceMappingBatchQueryForm(val source: String, val tagNames: List<String>)

data class SourceMappingBatchQueryResult(val tagName: String, val mappings: List<SourceMappingTargetItemDetail>)

data class SourceMappingTargetItemDetail(val metaType: MetaType, val metaTag: Any /* simple meta tag*/)

data class SourceMappingTargetItem(val metaType: MetaType, val metaId: Int)

data class SourceMappingMetaItem(val source: String, val name: String, val displayName: String?, val type: String?)

data class SourceMappingMetaItemForm(val source: String, val name: String, val displayName: Opt<String?>, val type: Opt<String?>)