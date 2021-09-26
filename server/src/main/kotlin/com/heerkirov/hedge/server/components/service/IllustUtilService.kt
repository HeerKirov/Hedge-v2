package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dto.CollectionSituationRes
import com.heerkirov.hedge.server.dto.IllustSimpleRes
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.business.takeThumbnailFilepath
import com.heerkirov.hedge.server.utils.filterInto
import com.heerkirov.hedge.server.utils.letIf
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class IllustUtilService(private val data: DataRepository) {
    /**
     * 查询一组illust的collection所属情况，列出这些illust已经属于的所有collection。
     * 这个工具API一般用于创建collection前，对内容列表校验，以提示用户如何创建collection。
     */
    fun getCollectionSituation(illustIds: List<Int>, exampleCount: Int = 5): List<CollectionSituationRes> {
        //查询所有的illust，不过IMAGE类型不包括在其中，它们跟collection没什么关系
        val (collectionResult, imageResult) = data.db.sequenceOf(Illusts)
            .filter { (it.id inList illustIds) and (it.type notEq Illust.Type.IMAGE) }
            .asKotlinSequence()
            .filterInto { it.type == Illust.Type.COLLECTION }

        //处理images。查询它们所属的collection
        val collectionResultIds = collectionResult.asSequence().map { it.id }.toSet()
        val imageResultParentIds = imageResult.asSequence().map { it.parentId!! }.filter { it !in collectionResultIds }.toSet()
        val imageParentResult = data.db.sequenceOf(Illusts).filter { (it.id inList imageResultParentIds) and (it.type eq Illust.Type.COLLECTION) }.toList()

        return (collectionResult.asSequence() + imageParentResult.asSequence())
            .sortedBy { it.orderTime }
            .map {
                val examples = data.db.from(Illusts)
                    .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
                    .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                        FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
                    .where { (Illusts.parentId eq it.id) and (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
                    .orderBy(Illusts.orderTime.asc())
                    .limit(exampleCount)
                    .map { row ->
                        val itemId = row[Illusts.id]!!
                        val thumbnailFile = takeThumbnailFilepath(row)
                        IllustSimpleRes(itemId, thumbnailFile)
                    }

                val belongs = imageResult
                    .filter { image -> image.parentId == it.id }
                    .map { image -> image.id }
                    .letIf(it.id in collectionResultIds) { l -> l + it.id }

                CollectionSituationRes(it.id, it.cachedChildrenCount, it.orderTime.parseDateTime(), examples, belongs)
            }.toList()
    }
}