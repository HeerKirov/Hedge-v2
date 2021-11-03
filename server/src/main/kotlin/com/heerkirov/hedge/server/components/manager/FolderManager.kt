package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.kit.FolderKit
import com.heerkirov.hedge.server.dao.collection.FolderImageRelations
import com.heerkirov.hedge.server.dao.collection.Folders
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class FolderManager(private val data: DataRepository, private val kit: FolderKit, private val illustManager: IllustManager) {
    /**
     * 从所有的folders中平滑移除一个image项。
     */
    fun removeItemInAllFolders(imageId: Int) {
        val relations = data.db.sequenceOf(FolderImageRelations).filter { it.imageId eq imageId }.toList()
        val folderIds = relations.asSequence().map { it.folderId }.toSet()

        for ((folderId, _, ordinal) in relations) {
            data.db.update(FolderImageRelations) {
                where { (it.folderId eq folderId) and (it.ordinal greater ordinal) }
                set(it.ordinal, it.ordinal minus 1)
            }
        }
        data.db.delete(FolderImageRelations) { it.imageId eq imageId }
        data.db.update(Folders) {
            where { it.id inList folderIds }
            set(it.cachedCount, it.cachedCount minus 1)
        }
    }
}