package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.dao.source.SourceTagRelations
import com.heerkirov.hedge.server.dto.SourceTagForm
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.types.undefined
import org.ktorm.dsl.*
import org.ktorm.entity.*

class SourceImageManager(private val data: DataRepository,
                         private val queryManager: QueryManager,
                         private val sourceTagManager: SourceTagManager) {
    /**
     * 检查source key。主要检查source是否是已注册的site，检查part是否存在，检查id/part是否为非负数。
     * @return 如果给出的值是null，那么返回null，否则，返回一个tuple，用于后续工具链处理。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun checkSource(source: String?, sourceId: Long?, sourcePart: Int?): Triple<String, Long, Int?>? {
        return if(source != null) {
            val site = data.metadata.source.sites.firstOrNull { it.name == source } ?: throw be(ResourceNotExist("source", source))

            if(sourceId == null) throw be(ParamRequired("sourceId"))
            else if(sourceId < 0) throw be(ParamError("sourceId"))

            if(site.hasSecondaryId && sourcePart == null) throw be(ParamRequired("sourcePart"))
            else if(!site.hasSecondaryId && sourcePart != null) throw be(ParamNotRequired("sourcePart"))

            if(sourcePart != null && sourcePart < 0) throw be(ParamError("sourcePart"))

            Triple(source, sourceId, sourcePart)
        }else{
            null
        }
    }

    /**
     * 检查source key。主要检查source是否是已注册的site，检查id/part是否为非负数。
     * @return 如果给出的值是null，那么返回null，否则，返回一个pair，用于后续工具链处理。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun checkSource(source: String?, sourceId: Long?): Pair<String, Long>? {
        return if(source != null) {
            data.metadata.source.sites.firstOrNull { it.name == source } ?: throw be(ResourceNotExist("source", source))

            if(sourceId == null) throw be(ParamRequired("sourceId"))
            else if(sourceId < 0) throw be(ParamError("sourceId"))

            Pair(source, sourceId)
        }else{
            null
        }
    }

    /**
     * 检查source key是否存在。如果存在，检查目标sourceImage是否存在并创建对应的记录。在创建之前自动检查source key。
     * @return (rowId, source, sourceId) 返回在sourceImage中实际存储的key。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun validateAndCreateSourceImageIfNotExist(source: String, sourceId: Long): Triple<Int?, String?, Long?> {
        val sourceImage = data.db.sequenceOf(SourceImages).firstOrNull { (it.source eq source) and (it.sourceId eq sourceId) }
        return if(sourceImage != null) {
            Triple(sourceImage.id, source, sourceId)
        }else{
            val now = DateTime.now()
            val id = data.db.insertAndGenerateKey(SourceImages) {
                set(it.source, source)
                set(it.sourceId, sourceId)
                set(it.title, null)
                set(it.description, null)
                set(it.relations, null)
                set(it.cachedCount, SourceImage.SourceCount(0, 0, 0))
                set(it.createTime, now)
                set(it.updateTime, now)
            } as Int

            Triple(id, source, sourceId)
        }
    }

    /**
     * 检查source key是否存在，创建对应记录，并手动更新内容。不会检查source合法性，因为假设之前已经校验过了。
     * @return (rowId, source, sourceId) 返回在sourceImage中实际存储的key。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws NotFound 请求对象不存在 (allowCreate=false时抛出)
     * @throws AlreadyExists 此对象已存在 (allowUpdate=false时抛出)
     */
    fun createOrUpdateSourceImage(source: String, sourceId: Long,
                                  title: Opt<String?> = undefined(),
                                  description: Opt<String?> = undefined(),
                                  tags: Opt<List<SourceTagForm>> = undefined(),
                                  pools: Opt<List<String>> = undefined(),
                                  relations: Opt<List<Int>> = undefined(),
                                  allowCreate: Boolean = true,
                                  allowUpdate: Boolean = true): Triple<Int?, String?, Long?> {
        val sourceImage = data.db.sequenceOf(SourceImages).firstOrNull { (it.source eq source) and (it.sourceId eq sourceId) }
        if(sourceImage == null) {
            if(!allowCreate) throw be(NotFound())
            //新建
            val sourceCount = SourceImage.SourceCount(
                tags.letOpt { it.size }.unwrapOr { 0 },
                pools.letOpt { it.size }.unwrapOr { 0 },
                relations.letOpt { it.size }.unwrapOr { 0 }
            )
            val empty = title.letOpt { it.isNullOrEmpty() }.unwrapOr { true }
                    && description.letOpt { it.isNullOrEmpty() }.unwrapOr { true }
                    && tags.letOpt { it.isEmpty() }.unwrapOr { true }
                    && pools.letOpt { it.isEmpty() }.unwrapOr { true }
                    && relations.letOpt { it.isEmpty() }.unwrapOr { true }

            val now = DateTime.now()
            val id = data.db.insertAndGenerateKey(SourceImages) {
                set(it.source, source)
                set(it.sourceId, sourceId)
                set(it.title, title.unwrapOrNull())
                set(it.description, description.unwrapOrNull())
                set(it.relations, relations.unwrapOrNull())
                set(it.pools, pools.unwrapOrNull())
                set(it.cachedCount, sourceCount)
                set(it.empty, empty)
                set(it.createTime, now)
                set(it.updateTime, now)
            } as Int

            tags.applyOpt {
                if(isNotEmpty()) {
                    val tagIds = sourceTagManager.getAndUpsertSourceTags(source, this)
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

            return Triple(id, source, sourceId)
        }else{
            if(!allowUpdate) throw be(AlreadyExists("SourceImage", "sourceId", sourceId))
            //更新
            val sourceCount = if(anyOpt(tags, pools, relations)) {
                Opt(SourceImage.SourceCount(
                    tags.letOpt { it.size }.unwrapOr { sourceImage.cachedCount.tagCount },
                    pools.letOpt { it.size }.unwrapOr { sourceImage.cachedCount.poolCount },
                    relations.letOpt { it.size }.unwrapOr { sourceImage.cachedCount.relationCount }
                ))
            }else undefined()

            val empty = title.unwrapOr { sourceImage.title }.isNullOrEmpty()
                    && description.unwrapOr { sourceImage.description }.isNullOrEmpty()
                    && if(pools.isPresent) { pools.value } else { sourceImage.pools }.isNullOrEmpty()
                    && if(relations.isPresent) { relations.value } else { sourceImage.relations }.isNullOrEmpty()
                    && if(tags.isPresent) { tags.value.isEmpty() } else { data.db.sequenceOf(SourceTagRelations).count { it.sourceId eq sourceImage.id } == 0 }

            if(title.isPresent || description.isPresent || relations.isPresent || sourceCount.isPresent) {
                data.db.update(SourceImages) {
                    where { it.id eq sourceImage.id }
                    title.applyOpt { set(it.title, this) }
                    description.applyOpt { set(it.description, this) }
                    relations.applyOpt { set(it.relations, this) }
                    pools.applyOpt { set(it.pools, this) }
                    sourceCount.applyOpt { set(it.cachedCount, this) }
                    set(it.empty, empty)
                    set(it.updateTime, DateTime.now())
                }
            }

            tags.applyOpt {
                data.db.delete(SourceTagRelations) { it.sourceId eq sourceImage.id }
                if(isNotEmpty()) {
                    val tagIds = sourceTagManager.getAndUpsertSourceTags(source, this)
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

            return Triple(sourceImage.id, source, sourceId)
        }
    }
}