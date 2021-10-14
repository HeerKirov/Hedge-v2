package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dao.source.SourceTagMappings
import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.be
import org.ktorm.dsl.*
import org.ktorm.entity.*
import org.ktorm.schema.Column

class SourceMappingManager(private val data: DataRepository, private val sourceTagManager: SourceTagManager) {
    fun batchQuery(form: SourceMappingBatchQueryForm): List<SourceMappingBatchQueryResult> {
        return data.db.from(SourceTagMappings)
            .innerJoin(SourceTags, (SourceTags.source eq SourceTagMappings.source) and (SourceTags.id eq SourceTagMappings.sourceTagId))
            .select(SourceTags.source, SourceTags.name, SourceTagMappings.targetMetaType, SourceTagMappings.targetMetaId)
            .where { (SourceTags.source eq form.source) and (SourceTags.name inList form.tagNames) }
            .map { row ->
                Pair(
                    Pair(row[SourceTags.source]!!, row[SourceTags.name]!!),
                    SourceMappingTargetItem(row[SourceTagMappings.targetMetaType]!!, row[SourceTagMappings.targetMetaId]!!)
                )
            }
            .groupBy { (s, _) -> s }
            .map { (s, mappings) -> SourceMappingBatchQueryResult(s.first, s.second, mappings.map { it.second }) }
    }

    fun query(source: String, tagName: String): List<SourceMappingTargetItem> {
        return data.db.from(SourceTagMappings)
            .innerJoin(SourceTags, (SourceTags.source eq SourceTagMappings.source) and (SourceTags.id eq SourceTagMappings.sourceTagId))
            .select(SourceTagMappings.targetMetaType, SourceTagMappings.targetMetaId)
            .where { (SourceTags.source eq source) and (SourceTags.name eq tagName) }
            .map { row -> SourceMappingTargetItem(row[SourceTagMappings.targetMetaType]!!, row[SourceTagMappings.targetMetaId]!!) }
    }

    fun query(metaType: MetaType, metaId: Int): List<SourceMappingMetaItem> {
        return data.db.from(SourceTagMappings)
            .innerJoin(SourceTags, (SourceTags.source eq SourceTagMappings.source) and (SourceTags.id eq SourceTagMappings.sourceTagId))
            .select(SourceTags.name, SourceTags.displayName, SourceTags.type, SourceTags.source)
            .where { SourceTagMappings.targetMetaType eq metaType and (SourceTagMappings.targetMetaId eq metaId) }
            .map { SourceMappingMetaItem(it[SourceTags.source]!!, it[SourceTags.name]!!, it[SourceTags.displayName], it[SourceTags.type]) }
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws ResourceNotExist ("authors" | "topics" | "tags", number[]) 给出的meta tag不存在
     */
    fun update(source: String, tagName: String, mappings: List<SourceMappingTargetItem>) {
        sourceTagManager.checkSource(source)
        //查出source tag
        val sourceTag = sourceTagManager.getOrCreateSourceTag(source, tagName)

        //首先查出所有已存在的mapping
        val old = data.db.sequenceOf(SourceTagMappings)
            .filter { it.source eq source and (it.sourceTagId eq sourceTag.id) }
            .asKotlinSequence()
            .associateBy({ SourceMappingTargetItem(it.targetMetaType, it.targetMetaId) }) { it.id }
        val current = mappings.toSet()
        //校验所有meta tag项都已存在
        val metaIds = mappings.groupBy { it.metaType }.mapValues { (_, values) -> values.map { it.metaId } }
        metaIds[MetaType.AUTHOR]?.validateMetaTagExist("authors", Authors) { it.id }
        metaIds[MetaType.TOPIC]?.validateMetaTagExist("topics", Topics) { it.id }
        metaIds[MetaType.TAG]?.validateMetaTagExist("tags", Tags) { it.id }

        //筛选出add项，增加这些项
        val added = current - old.keys
        if(added.isNotEmpty()) data.db.batchInsert(SourceTagMappings) {
            for (item in added) {
                item {
                    set(it.source, source)
                    set(it.sourceTagId, sourceTag.id)
                    set(it.targetMetaType, item.metaType)
                    set(it.targetMetaId, item.metaId)
                }
            }
        }

        //筛选出delete项，将这些项删除
        val deleted = (old.keys - current).map { old[it]!! }
        if(deleted.isNotEmpty()) data.db.delete(SourceTagMappings) { it.id inList deleted }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun update(metaType: MetaType, metaId: Int, mappings: List<SourceMappingMetaItem>) {
        //查询meta tag确定存在
        if(!when (metaType) {
            MetaType.TAG -> data.db.sequenceOf(Tags).any { it.id eq metaId }
            MetaType.TOPIC -> data.db.sequenceOf(Topics).any { it.id eq metaId }
            MetaType.AUTHOR -> data.db.sequenceOf(Authors).any { it.id eq metaId }
        }) throw be(NotFound())

        //处理所有给出项的更新，并获得这些source tag的id
        val mappingGroups = mappings.groupBy { it.source }
        mappingGroups.forEach { (source, _) -> sourceTagManager.checkSource(source) }
        val current = mappingGroups.flatMap { (source, row) ->
            val sourceTags = row.map { SourceTagDto(it.name, it.displayName, it.type) }
            sourceTagManager.getAndUpsertSourceTags(source, sourceTags).map { source to it }
        }

        //查询目前所有已存在的mapping source tag
        val old = data.db.sequenceOf(SourceTagMappings)
            .filter { it.targetMetaType eq metaType and (it.targetMetaId eq metaId) }
            .associateBy({ it.source to it.sourceTagId }) { it.id }

        //筛选出add项，增加这些项
        val added = current - old.keys
        if(added.isNotEmpty()) data.db.batchInsert(SourceTagMappings) {
            for ((source, sourceTagId) in added) {
                item {
                    set(it.source, source)
                    set(it.sourceTagId, sourceTagId)
                    set(it.targetMetaType, metaType)
                    set(it.targetMetaId, metaId)
                }
            }
        }

        //筛选出delete项，将这些项删除
        val deleted = (old.keys - current).map { old[it]!! }
        if(deleted.isNotEmpty()) data.db.delete(SourceTagMappings) { it.id inList deleted }
    }

    private inline fun <T : Any> List<Int>?.validateMetaTagExist(propName: String, dto: MetaTag<T>, getId: (MetaTag<T>) -> Column<Int>) {
        if(this != null) {
            val idCol = getId(dto)
            val existIds = data.db.from(dto).select(idCol).where { idCol inList this }.map { it[idCol]!! }
            val lack = this.toSet() - existIds.toSet()
            if(lack.isNotEmpty()) throw be(ResourceNotExist(propName, lack))
        }
    }
}