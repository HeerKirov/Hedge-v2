package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamNotRequired
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.types.undefined
import org.ktorm.dsl.and
import org.ktorm.dsl.eq
import org.ktorm.dsl.insert
import org.ktorm.dsl.update
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.none
import org.ktorm.entity.sequenceOf

class SourceManager(private val data: DataRepository) {
    /**
     * 检查source key。主要检查source是否是已注册的site，检查part是否存在，检查id/part是否为非负数。
     */
    fun checkSource(source: String?, sourceId: Long?, sourcePart: Int?) {
        if(source != null) {
            val site = data.metadata.source.sites.firstOrNull { it.name.equals(source, ignoreCase = true) } ?: throw ResourceNotExist("source", source)

            if(sourceId == null) throw ParamRequired("sourceId")
            else if(sourceId < 0) throw ParamError("sourceId")

            if(site.hasSecondaryId && sourcePart == null) throw ParamRequired("sourcePart")
            else if(!site.hasSecondaryId && sourcePart != null) throw ParamNotRequired("sourcePart")

            if(sourcePart != null && sourcePart < 0) throw ParamError("sourcePart")
        }
    }

    /**
     * 检查source key是否存在。如果存在，检查目标sourceImage是否存在并创建对应的记录。在创建之前自动检查source key。
     * @return 返回在sourceImage中实际存储的key。被省略的参数会被-1取代。
     */
    fun validateAndCreateSourceImageIfNotExist(source: String?, sourceId: Long?, sourcePart: Int?): Triple<String?, Long?, Int?> {
        if(source == null) return Triple(null, null, null)
        checkSource(source, sourceId, sourcePart)

        val realSourceId = sourceId!!
        val realSourcePart = sourcePart ?: -1

        if(data.db.sequenceOf(SourceImages).none { (it.source eq source) and (it.sourceId eq realSourceId) and (it.sourcePart eq realSourcePart) }) {
            data.db.insert(SourceImages) {
                set(it.source, source)
                set(it.sourceId, realSourceId)
                set(it.sourcePart, realSourcePart)
                set(it.title, null)
                set(it.description, null)
                set(it.tags, null)
                set(it.relations, null)
                set(it.analyseStatus, SourceImage.AnalyseStatus.NO)
                set(it.analyseTime, null)
            }
        }

        return Triple(source, realSourceId, realSourcePart)
    }

    /**
     * 检查source key是否存在，创建对应记录，并手动更新内容。
     * @return 返回在sourceImage中实际存储的key。被省略的参数会被-1取代。
     */
    fun createOrUpdateSourceImage(source: String?, sourceId: Long?, sourcePart: Int?,
                                  title: Opt<String?> = undefined(),
                                  description: Opt<String?> = undefined(),
                                  tags: Opt<List<SourceImage.SourceTag>> = undefined(),
                                  pools: Opt<List<String>> = undefined(),
                                  children: Opt<List<Int>> = undefined(),
                                  parents: Opt<List<Int>> = undefined()): Triple<String?, Long?, Int?> {
        if(source == null) return Triple(null, null, null)
        checkSource(source, sourceId, sourcePart)
        val realSourceId = sourceId!!
        val realSourcePart = sourcePart ?: -1

        val sourceImage = data.db.sequenceOf(SourceImages).firstOrNull { (it.source eq source) and (it.sourceId eq realSourceId) and (it.sourcePart eq realSourcePart) }
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

            data.db.insert(SourceImages) {
                set(it.source, source)
                set(it.sourceId, realSourceId)
                set(it.sourcePart, realSourcePart)
                set(it.title, title.unwrapOr { null })
                set(it.description, description.unwrapOr { null })
                set(it.tags, tags.runOpt { takeIf { t -> t.isNotEmpty() } }.unwrapOr { null })
                set(it.relations, relations)
                set(it.analyseStatus, analyseStatus)
                set(it.analyseTime, null)
            }
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

            data.db.update(SourceImages) {
                where { (it.source eq source) and (it.sourceId eq realSourceId) and (it.sourcePart eq realSourcePart) }
                analyseStatus.applyOpt { set(it.analyseStatus, this) }
                title.applyOpt { set(it.title, this) }
                description.applyOpt { set(it.description, this) }
                tags.applyOpt { set(it.tags, this) }
                relations.applyOpt { set(it.relations, this) }
            }
        }

        return Triple(source, realSourceId, realSourcePart)
    }
}