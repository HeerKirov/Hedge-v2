package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.exceptions.ParamNotRequired
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist

class SourceImageManager(private val data: DataRepository) {
    /**
     * 检查source key。主要检查source是否是已注册的site，并检查id是否存在，检查part是否存在。
     */
    fun checkSource(source: String, sourceId: Long?, sourcePart: Int?) {
        val site = data.metadata.source.sites.firstOrNull { it.name.equals(source, ignoreCase = true) } ?: throw ResourceNotExist("source", source)
        if(site.hasId && sourceId == null) throw ParamRequired("sourceId")
        else if(!site.hasId && sourceId != null) throw ParamNotRequired("sourceId")
        if(site.hasSecondaryId && sourcePart == null) throw ParamRequired("sourcePart")
        else if(!site.hasSecondaryId && sourcePart != null) throw ParamNotRequired("sourcePart")
    }
}