package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamNotRequired
import com.heerkirov.hedge.server.exceptions.ParamRequired
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.source.SourceImage
import me.liuwj.ktorm.dsl.and
import me.liuwj.ktorm.dsl.eq
import me.liuwj.ktorm.dsl.insert
import me.liuwj.ktorm.entity.none
import me.liuwj.ktorm.entity.sequenceOf

class SourceManager(private val data: DataRepository) {
    /**
     * 检查source key。主要检查source是否是已注册的site，检查part是否存在，检查id/part是否为非负数。
     */
    fun checkSource(source: String?, sourceId: Long?, sourcePart: Int?) {
        if(source != null) {
            val site = data.metadata.source.sites.firstOrNull { it.name.equals(source, ignoreCase = true) } ?: throw ResourceNotExist("source", source)

            if(site.hasSecondaryId && sourcePart == null) throw ParamRequired("sourcePart")
            else if(!site.hasSecondaryId && sourcePart != null) throw ParamNotRequired("sourcePart")

            if(sourceId == null) throw ParamRequired("sourceId")
            else if(sourceId < 0) throw ParamError("sourceId")

            if(sourcePart != null && sourcePart < 0) throw ParamError("sourcePart")
        }
    }

    /**
     * 检查source key是否存在。如果存在，检查目标sourceImage是否存在并创建对应的记录。在创建之前自动检查source key。
     * @return 返回在sourceImage中实际存储的key。被省略的参数会被-1取代。
     */
    fun validateAndCreateSourceImageIfNotExist(source: String?, sourceId: Long?, sourcePart: Int?): Triple<String?, Long?, Int?> {
        if(source == null) {
            return Triple(null, null, null)
        }
        checkSource(source, sourceId, sourcePart)

        val realSourceId = sourceId!!
        val realSourcePart = sourcePart ?: -1

        if(data.db.sequenceOf(SourceImages).none { (it.source eq source) and (it.sourceId eq realSourceId) and (it.sourcePart eq realSourcePart) }) {
            newSourceImage(source, realSourceId, realSourcePart)
        }

        return Triple(source, realSourceId, realSourcePart)
    }

    /**
     * 创建目标sourceImage。
     */
    private fun newSourceImage(source: String, sourceId: Long, sourcePart: Int) {
        data.db.insert(SourceImages) {
            set(it.source, source)
            set(it.sourceId, sourceId)
            set(it.sourcePart, sourcePart)
            set(it.title, null)
            set(it.description, null)
            set(it.tags, null)
            set(it.relations, null)
            set(it.analyseStatus, SourceImage.AnalyseStatus.NO)
            set(it.analyseTime, null)
        }
    }
}