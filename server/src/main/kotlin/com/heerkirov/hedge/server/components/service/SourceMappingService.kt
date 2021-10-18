package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.SourceMappingManager
import com.heerkirov.hedge.server.dto.SourceMappingBatchQueryForm
import com.heerkirov.hedge.server.dto.SourceMappingBatchQueryResult
import com.heerkirov.hedge.server.dto.SourceMappingTargetItem
import com.heerkirov.hedge.server.dto.SourceMappingTargetItemDetail
import com.heerkirov.hedge.server.exceptions.ResourceNotExist

class SourceMappingService(private val data: DataRepository, private val sourceMappingManager: SourceMappingManager) {
    fun batchQuery(form: SourceMappingBatchQueryForm): List<SourceMappingBatchQueryResult> {
        return sourceMappingManager.batchQuery(form)
    }

    fun query(source: String, tagName: String): List<SourceMappingTargetItemDetail> {
        return sourceMappingManager.query(source, tagName)
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws ResourceNotExist ("authors" | "topics" | "tags", number[]) 给出的meta tag不存在
     */
    fun update(source: String, tagName: String, form: List<SourceMappingTargetItem>) {
        data.db.transaction {
            sourceMappingManager.update(source, tagName, form)
        }
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun delete(source: String, tagName: String) {
        data.db.transaction {
            sourceMappingManager.update(source, tagName, emptyList())
        }
    }
}