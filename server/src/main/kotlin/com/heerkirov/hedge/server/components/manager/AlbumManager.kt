package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.backend.exporter.AlbumMetadataExporterTask
import com.heerkirov.hedge.server.components.backend.exporter.BackendExporter
import com.heerkirov.hedge.server.components.backend.exporter.IllustAlbumMemberExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.utils.DateTime
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class AlbumManager(private val data: DataRepository,
                   private val kit: AlbumKit,
                   private val illustManager: IllustManager,
                   private val backendExporter: BackendExporter) {
    /**
     * 从所有的albums中平滑移除一个image项。将数量统计-1。如果删掉的image是封面，重新获得下一张封面。
     */
    fun removeItemInAllAlbums(imageId: Int, exportMetaTags: Boolean = false) {
        val relations = data.db.sequenceOf(AlbumImageRelations).filter { it.imageId eq imageId }.toList()
        val albumIds = relations.asSequence().map { it.albumId }.toSet()

        for ((albumId, _, ordinal) in relations) {
            data.db.update(AlbumImageRelations) {
                where { (it.albumId eq albumId) and (it.ordinal greater ordinal) }
                set(it.ordinal, it.ordinal minus 1)
            }
            if(ordinal == 0) {
                //ordinal为0表示此image在此album中是封面，因此需要导出新的封面。
                val newCoverFileId = data.db.from(AlbumImageRelations).innerJoin(Illusts, AlbumImageRelations.imageId eq Illusts.id)
                    .select(Illusts.fileId)
                    .where { (AlbumImageRelations.albumId eq albumId) and (AlbumImageRelations.ordinal eq 0) }
                    .map { it[Illusts.fileId]!! }
                    .firstOrNull()
                data.db.update(Albums) {
                    where { it.id eq albumId }
                    set(it.fileId, newCoverFileId)
                }
            }
            if(exportMetaTags) {
                backendExporter.add(AlbumMetadataExporterTask(albumId, exportMetaTag = true))
            }
        }
        data.db.delete(AlbumImageRelations) { it.imageId eq imageId }
        data.db.update(Albums) {
            where { it.id inList albumIds }
            set(it.cachedCount, it.cachedCount minus 1)
        }
    }

    /**
     * 向所有指定的albums中平滑添加一个image项，数量+1，并重新导出。
     * @param albums (albumId, ordinal)[]
     */
    fun addItemInFolders(imageId: Int, albums: List<Pair<Int, Int>>, exportMetaTags: Boolean = false) {
        val imageIds = listOf(imageId)
        for ((albumId, ordinal) in albums) {
            kit.upsertSubImages(albumId, imageIds, ordinal)
            if(exportMetaTags) backendExporter.add(AlbumMetadataExporterTask(albumId, exportMetaTag = true))
        }
        backendExporter.add(IllustAlbumMemberExporterTask(imageIds))
    }

    /**
     * 新建一个album。
     * @throws ResourceNotExist ("images", number[]) image项不存在。给出imageId列表
     */
    fun newAlbum(formImages: List<Int>, formTitle: String = "", formDescription: String = "", formScore: Int? = null, formFavorite: Boolean = false): Int {
        val images = if(formImages.isNotEmpty()) illustManager.unfoldImages(formImages) else emptyList()
        val fileId = images.firstOrNull()?.fileId
        val createTime = DateTime.now()

        val id = data.db.insertAndGenerateKey(Albums) {
            set(it.title, formTitle)
            set(it.description, formDescription)
            set(it.score, formScore)
            set(it.favorite, formFavorite)
            set(it.fileId, fileId)
            set(it.cachedCount, images.size)
            set(it.createTime, createTime)
            set(it.updateTime, createTime)
        } as Int

        kit.updateSubImages(id, images.map { it.id })

        kit.refreshAllMeta(id)

        return id
    }
}