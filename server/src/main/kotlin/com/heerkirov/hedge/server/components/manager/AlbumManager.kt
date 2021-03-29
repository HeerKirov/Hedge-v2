package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.AlbumKit
import com.heerkirov.hedge.server.dao.album.AlbumImageRelations
import com.heerkirov.hedge.server.dao.album.Albums
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.model.album.Album
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.first
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.map
import org.ktorm.entity.sequenceOf

class AlbumManager(private val data: DataRepository, private val kit: AlbumKit) {
    /**
     * 从所有的albums中平滑移除一个image项。将数量统计-1。如果删掉的image是封面，重新获得下一张封面。
     */
    fun removeItemInAllAlbums(imageId: Int) {
        val relations = data.db.sequenceOf(AlbumImageRelations).filter { it.imageId eq imageId }
        val albumIds = relations.map { it.albumId }
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
        }
        data.db.delete(AlbumImageRelations) { it.imageId eq imageId }
        data.db.update(Albums) {
            where { it.id inList albumIds }
            set(it.cachedCount, it.cachedCount minus 1)
        }
    }

    /**
     * 新建一个album。
     */
    fun newAlbum(formImages: List<Any>, formTitle: String = "", formDescription: String = "", formScore: Int? = null, formFavorite: Boolean = false): Int {
        val (images, imageCount, fileId) = kit.validateSubImages(formImages)
        val createTime = DateTime.now()

        val id = data.db.insertAndGenerateKey(Albums) {
            set(it.title, formTitle)
            set(it.description, formDescription)
            set(it.score, formScore)
            set(it.favorite, formFavorite)
            set(it.fileId, fileId)
            set(it.cachedCount, imageCount)
            set(it.createTime, createTime)
            set(it.updateTime, createTime)
        } as Int

        kit.processSubImages(images, id)

        return id
    }
}