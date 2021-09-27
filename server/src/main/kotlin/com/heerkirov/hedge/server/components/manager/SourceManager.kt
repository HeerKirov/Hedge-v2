package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.dao.source.SourceTagRelations
import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.dto.SourceTagDto
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.model.source.SourceTag
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.types.undefined
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class SourceManager(private val data: DataRepository, private val queryManager: QueryManager) {
    /**
     * 检查source key。主要检查source是否是已注册的site，检查part是否存在，检查id/part是否为非负数。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun checkSource(source: String?, sourceId: Long?, sourcePart: Int?) {
        if(source != null) {
            val site = data.metadata.source.sites.firstOrNull { it.name.equals(source, ignoreCase = true) } ?: throw be(ResourceNotExist("source", source))

            if(sourceId == null) throw be(ParamRequired("sourceId"))
            else if(sourceId < 0) throw be(ParamError("sourceId"))

            if(site.hasSecondaryId && sourcePart == null) throw be(ParamRequired("sourcePart"))
            else if(!site.hasSecondaryId && sourcePart != null) throw be(ParamNotRequired("sourcePart"))

            if(sourcePart != null && sourcePart < 0) throw be(ParamError("sourcePart"))
        }
    }

    /**
     * 检查source key是否存在。如果存在，检查目标sourceImage是否存在并创建对应的记录。在创建之前自动检查source key。
     * @return 返回在sourceImage中实际存储的key。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun validateAndCreateSourceImageIfNotExist(source: String?, sourceId: Long?, sourcePart: Int?): Triple<Int?, String?, Long?> {
        if(source == null) return Triple(null, null, null)
        checkSource(source, sourceId, sourcePart)

        val realSourceId = sourceId!!

        val sourceImage = data.db.sequenceOf(SourceImages).firstOrNull { (it.source eq source) and (it.sourceId eq realSourceId) }
        return if(sourceImage != null) {
            Triple(sourceImage.id, source, realSourceId)
        }else{
            val id = data.db.insertAndGenerateKey(SourceImages) {
                set(it.source, source)
                set(it.sourceId, realSourceId)
                set(it.title, null)
                set(it.description, null)
                set(it.relations, null)
                set(it.analyseStatus, SourceImage.AnalyseStatus.NO)
                set(it.analyseTime, null)
            } as Int

            Triple(id, source, realSourceId)
        }
    }

    /**
     * 检查source key是否存在，创建对应记录，并手动更新内容。
     * @return 返回在sourceImage中实际存储的key。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun createOrUpdateSourceImage(source: String?, sourceId: Long?, sourcePart: Int?,
                                  title: Opt<String?> = undefined(),
                                  description: Opt<String?> = undefined(),
                                  tags: Opt<List<SourceTagDto>> = undefined(),
                                  pools: Opt<List<String>> = undefined(),
                                  children: Opt<List<Int>> = undefined(),
                                  parents: Opt<List<Int>> = undefined()): Triple<Int?, String?, Long?> {
        if(source == null) return Triple(null, null, null)
        checkSource(source, sourceId, sourcePart)
        val realSourceId = sourceId!!

        val sourceImage = data.db.sequenceOf(SourceImages).firstOrNull { (it.source eq source) and (it.sourceId eq realSourceId) }
        if(sourceImage == null) {
            //新建
            val analyseStatus = if(anyOpt(title, description, tags, pools, children, parents))
                SourceImage.AnalyseStatus.MANUAL else SourceImage.AnalyseStatus.NO

            val relations = if(anyOpt(pools, children, parents)) {
                SourceImage.SourceRelation(
                    pools.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { null },
                    parents.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { null },
                    children.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { null }
                )
            }else null

            val id = data.db.insertAndGenerateKey(SourceImages) {
                set(it.source, source)
                set(it.sourceId, realSourceId)
                set(it.title, title.unwrapOr { null })
                set(it.description, description.unwrapOr { null })
                set(it.relations, relations)
                set(it.analyseStatus, analyseStatus)
                set(it.analyseTime, null)
            } as Int

            tags.applyOpt {
                if(isNotEmpty()) {
                    val tagIds = getAndUpsertSourceTags(source, this)
                    data.db.batchInsert(SourceTagRelations) {
                        for (tagId in tagIds) {
                            item {
                                set(it.sourceId, id)
                                set(it.tagId, tagId)
                            }
                        }
                    }
                    queryManager.flushCacheOf(QueryManager.CacheType.SOURCE_TAG)
                }
            }

            return Triple(id, source, realSourceId)
        }else{
            //更新
            val analyseStatus = if(sourceImage.analyseStatus != SourceImage.AnalyseStatus.MANUAL && anyOpt(title, description, tags, pools, children, parents))
                Opt(SourceImage.AnalyseStatus.MANUAL) else undefined()

            val relations = if(anyOpt(pools, children, parents)) {
                Opt(SourceImage.SourceRelation(
                    pools.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { sourceImage.relations?.pools },
                    parents.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { sourceImage.relations?.parents },
                    children.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { sourceImage.relations?.children }
                ))
            }else undefined()

            if(analyseStatus.isPresent || title.isPresent || description.isPresent || relations.isPresent) {
                data.db.update(SourceImages) {
                    where { it.id eq sourceImage.id }
                    analyseStatus.applyOpt { set(it.analyseStatus, this) }
                    title.applyOpt { set(it.title, this) }
                    description.applyOpt { set(it.description, this) }
                    relations.applyOpt { set(it.relations, this) }
                }
            }

            tags.applyOpt {
                data.db.delete(SourceTagRelations) { it.sourceId eq sourceImage.id }
                if(isNotEmpty()) {
                    val tagIds = getAndUpsertSourceTags(source, this)
                    data.db.batchInsert(SourceTagRelations) {
                        for (tagId in tagIds) {
                            item {
                                set(it.sourceId, sourceImage.id)
                                set(it.tagId, tagId)
                            }
                        }
                    }
                    queryManager.flushCacheOf(QueryManager.CacheType.SOURCE_TAG)
                }
                queryManager.flushCacheOf(QueryManager.CacheType.SOURCE_TAG)
            }

            return Triple(sourceImage.id, source, realSourceId)
        }

    }

    /**
     * 根据给出的tags dto，创建或修改数据库里的source tag model，并返回这些模型的id。
     */
    private fun getAndUpsertSourceTags(source: String, tags: List<SourceTagDto>): List<Int> {
        val tagMap = tags.associateBy { it.name }

        val dbTags = data.db.sequenceOf(SourceTags).filter { (it.source eq source) and (it.name inList tagMap.keys) }.toList()
        val dbTagMap = dbTags.associateBy { it.name }

        fun SourceTag.mapToDto() = SourceTagDto(name, displayName, type)

        //挑选出目前在数据库里没有的tag
        val minus = tagMap.keys - dbTagMap.keys
        if(minus.isNotEmpty()) {
            data.db.batchInsert(SourceTags) {
                for (name in minus) {
                    val tag = tagMap[name]!!
                    item {
                        set(it.source, source)
                        set(it.name, name)
                        set(it.displayName, tag.displayName)
                        set(it.type, tag.type)
                    }
                }
            }
        }

        //挑选出在数据库里有，但是发生了变化的tag
        val common = tagMap.keys.intersect(dbTagMap.keys).filter { tagMap[it]!! != dbTagMap[it]!!.mapToDto() }
        if(common.isNotEmpty()) {
            data.db.batchUpdate(SourceTags) {
                for (name in common) {
                    val tag = tagMap[name]!!
                    val dbTag = dbTagMap[name]!!
                    item {
                        where { it.id eq dbTag.id }
                        set(it.displayName, tag.displayName)
                        set(it.type, tag.type)
                    }
                }
            }
        }

        return data.db.from(SourceTags).select(SourceTags.id)
            .where { (SourceTags.source eq source) and (SourceTags.name inList tagMap.keys) }
            .map { it[SourceTags.id]!! }
    }
}