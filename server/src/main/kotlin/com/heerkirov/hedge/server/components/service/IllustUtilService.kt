package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.dto.CollectionSituationRes
import com.heerkirov.hedge.server.dto.IllustParent
import com.heerkirov.hedge.server.dto.IllustSimpleRes
import com.heerkirov.hedge.server.dto.ImageSituationRes
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.business.takeThumbnailFilepath
import com.heerkirov.hedge.server.utils.filterInto
import com.heerkirov.hedge.server.utils.letIf
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList
import java.time.LocalDateTime

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

    /**
     * 查询一组illust中，所有的image和collection下属的image。同时，列出每个image的所属集合。
     * 这个工具API一般用于拖放illusts后，对内容列表做整体解析。
     */
    fun getImageSituation(illustIds: List<Int>): List<ImageSituationRes> {
        data class Row(val id: Int, val type: Illust.Type, val parentId: Int?, val childrenCount: Int?, val orderTime: LocalDateTime, val thumbnailFile: String)
        data class ChildrenRow(val id: Int, val parentId: Int, val orderTime: LocalDateTime, val thumbnailFile: String)
        //先根据id列表把所有的illust查询出来, 然后从中分离collection, image, image_with_parent
        val rows = data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.parentId, Illusts.orderTime, Illusts.cachedChildrenCount, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.id inList illustIds }
            .map { row ->
                val thumbnailFile = takeThumbnailFilepath(row)
                Row(row[Illusts.id]!!, row[Illusts.type]!!, row[Illusts.parentId], row[Illusts.cachedChildrenCount], row[Illusts.orderTime]!!.parseDateTime(), thumbnailFile)
            }
            .groupBy { it.type }
        val collectionRows = rows.getOrDefault(Illust.Type.COLLECTION, emptyList())
        val imageRows = rows.getOrDefault(Illust.Type.IMAGE, emptyList())
        val imageWithParentRows = rows.getOrDefault(Illust.Type.IMAGE_WITH_PARENT, emptyList())

        //对于collection，查询下属的所有children
        val childrenRows = data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.parentId, Illusts.orderTime, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { (Illusts.parentId inList collectionRows.map { it.id }) and (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
            .map { row ->
                val thumbnailFile = takeThumbnailFilepath(row)
                ChildrenRow(row[Illusts.id]!!, row[Illusts.parentId]!!, row[Illusts.orderTime]!!.parseDateTime(), thumbnailFile)
            }

        //查询image_with_parent类图像的parent信息。查询时排除collection已有的项
        val imageWithParentIds = imageWithParentRows.asSequence().map { it.parentId!! }.toSet() - collectionRows.asSequence().map { it.id }.toSet()
        val parentsOfImages = data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.cachedChildrenCount, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { (Illusts.id inList imageWithParentIds) and (Illusts.type eq Illust.Type.COLLECTION) }
            .associate {
                val id = it[Illusts.id]!!
                val thumbnailFile = takeThumbnailFilepath(it)
                id to IllustParent(id, thumbnailFile, it[Illusts.cachedChildrenCount]!!)
            }
        //将collection转换为children类图像的parent信息
        val parentsOfChildren = collectionRows.associate { it.id to IllustParent(it.id, it.thumbnailFile, it.childrenCount!!) }
        //联立成完全的parent查询表
        val allParents = parentsOfImages + parentsOfChildren

        //将childrenRows和imageRows组合编排成结果集
        val childrenResult = childrenRows.asSequence().map { ImageSituationRes(it.id, it.thumbnailFile, it.orderTime, allParents[it.parentId]) }
        val imageResult = imageRows.asSequence().map { ImageSituationRes(it.id, it.thumbnailFile, it.orderTime, null) }
        val imageWithParentResult = imageWithParentRows.asSequence().map { ImageSituationRes(it.id, it.thumbnailFile, it.orderTime, allParents[it.parentId]) }

        return (childrenResult + imageResult + imageWithParentResult).distinctBy { it.id }.sortedBy { it.orderTime }.toList()
    }
}