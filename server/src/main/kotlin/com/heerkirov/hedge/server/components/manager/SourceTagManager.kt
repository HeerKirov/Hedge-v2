package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.dto.SourceTagDto
import com.heerkirov.hedge.server.dto.SourceTagForm
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.source.SourceTag
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class SourceTagManager(private val data: DataRepository) {
    /**
     * 校验source的合法性。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun checkSource(source: String) {
        data.metadata.source.sites.firstOrNull { it.name == source } ?: throw be(ResourceNotExist("source", source))
    }

    /**
     * 查询目标source tag，或在它不存在时创建它，将其余属性留空。
     * 不会校验source的合法性，因为假设之前已经手动校验过了。
     */
    fun getOrCreateSourceTag(source: String, sourceTagName: String): SourceTag {
        return data.db.sequenceOf(SourceTags)
            .firstOrNull { it.source eq source and (it.name eq sourceTagName) }
            ?: run {
                val id = data.db.insertAndGenerateKey(SourceTags) {
                    set(it.source, source)
                    set(it.name, sourceTagName)
                    set(it.displayName, null)
                    set(it.type, null)
                } as Int
                SourceTag(id, source, sourceTagName, null, null)
            }
    }

    /**
     * 在image的source update方法中，根据给出的tags dto，创建或修改数据库里的source tag model，并返回这些模型的id。
     * 这个方法的逻辑是，source tags总是基于其name做唯一定位，当name不变时，修改其他属性视为更新，而改变name即认为是不同的对象。
     * 不会校验source的合法性，因为假设之前已经手动校验过了。
     */
    fun getAndUpsertSourceTags(source: String, tags: List<SourceTagForm>): List<Int> {
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
                        set(it.displayName, tag.displayName.unwrapOrNull())
                        set(it.type, tag.type.unwrapOrNull())
                    }
                }
            }
        }

        //挑选出在数据库里有，但是发生了变化的tag
        val common = tagMap.keys.intersect(dbTagMap.keys).filter { key ->
            val form = tagMap[key]!!
            if(form.type.isPresent || form.displayName.isPresent) {
                val dto = dbTagMap[key]!!.mapToDto()
                form.type.letOpt { it != dto.type }.unwrapOr { false } || form.displayName.letOpt { it != dto.displayName }.unwrapOr { false }
            }else{
                false
            }
        }
        if(common.isNotEmpty()) {
            data.db.batchUpdate(SourceTags) {
                for (name in common) {
                    val tag = tagMap[name]!!
                    val dbTag = dbTagMap[name]!!
                    item {
                        where { it.id eq dbTag.id }
                        tag.displayName.applyOpt { set(it.displayName, this) }
                        tag.type.applyOpt { set(it.type, this) }
                    }
                }
            }
        }

        return data.db.from(SourceTags).select(SourceTags.id)
            .where { (SourceTags.source eq source) and (SourceTags.name inList tagMap.keys) }
            .map { it[SourceTags.id]!! }
    }
}