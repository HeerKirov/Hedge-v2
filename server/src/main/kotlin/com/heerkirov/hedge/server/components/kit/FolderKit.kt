package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.collection.FolderImageRelations
import com.heerkirov.hedge.server.dao.collection.Folders
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.runIf
import org.ktorm.dsl.*
import org.ktorm.dsl.map
import org.ktorm.entity.*

class FolderKit(private val data: DataRepository) {
    /**
     * 校验title是否合法，包括空检查、重复检查。
     */
    fun validateTitle(title: String, thisId: Int? = null) {
        if(title.isBlank()) throw ParamTypeError("title", "cannoe be blank")
        if(data.db.sequenceOf(Folders).any { (it.title eq title).runIf(thisId != null) { this and (it.id notEq thisId!!) } }) throw AlreadyExists("Folder", "title", title)
    }

    /**
     * 校验folder的sub items列表的正确性。
     */
    fun validateSubImages(imageIds: List<Int>) {
        if(imageIds.isEmpty()) return

        val images = data.db.from(Illusts)
            .select(Illusts.id)
            .where { (Illusts.id inList imageIds) and (Illusts.type notEq Illust.Type.COLLECTION) }
            .map { it[Illusts.id]!! }
        //数量不够表示有imageId不存在(或类型是collection，被一同判定为不存在)
        if(images.size < imageIds.size) throw ResourceNotExist("images", imageIds.toSet() - images.toSet())
    }

    /**
     * 应用images列表。对列表进行整体替换。
     */
    fun processSubImages(imageIds: List<Int>, thisId: Int) {
        data.db.delete(FolderImageRelations) { it.folderId eq thisId }
        data.db.batchInsert(FolderImageRelations) {
            imageIds.forEachIndexed { index, imageId ->
                item {
                    set(it.folderId, thisId)
                    set(it.ordinal, index)
                    set(it.imageId, imageId)
                }
            }
        }
    }

    /**
     * 插入新的images。
     */
    fun insertSubImages(imageIds: List<Int>, thisId: Int, ordinal: Int?) {
        val count = data.db.sequenceOf(FolderImageRelations).count { it.folderId eq thisId }
        val insertOrdinal = if(ordinal != null && ordinal <= count) ordinal else count
        //先把原有位置的项向后挪动
        data.db.update(FolderImageRelations) {
            where { (it.folderId eq thisId) and (it.ordinal greaterEq insertOrdinal) }
            set(it.ordinal, it.ordinal plus imageIds.size)
        }
        //然后插入新项
        data.db.batchInsert(FolderImageRelations) {
            imageIds.forEachIndexed { index, imageId ->
                item {
                    set(it.folderId, thisId)
                    set(it.ordinal, insertOrdinal + index)
                    set(it.imageId, imageId)
                }
            }
        }
    }

    /**
     * 移动一部分images的顺序。
     */
    fun moveSubImages(indexes: List<Int>, thisId: Int, ordinal: Int?) {
        if(indexes.isNotEmpty()) {
            val sortedIndexes = indexes.sorted()
            val count = data.db.sequenceOf(FolderImageRelations).count { it.folderId eq thisId }
            val insertOrdinal = if(ordinal != null && ordinal <= count) ordinal else count
            val itemMap = data.db.sequenceOf(FolderImageRelations)
                .filter { (it.folderId eq thisId) and (it.ordinal inList indexes) }
                .map { it.ordinal to it.imageId }.toMap()

            if(itemMap.size < indexes.size) throw ResourceNotExist("itemIndexes", indexes.toSet() - itemMap.keys)
            //先删除所有要移动的项
            data.db.delete(FolderImageRelations) { (it.folderId eq thisId) and (it.ordinal inList indexes) }
            //将余下的项向前缩进
            data.db.batchUpdate(FolderImageRelations) {
                sortedIndexes.asSequence()
                    .windowed(2, 1, true) { it[0] to it.getOrElse(1) { count } }
                    .forEachIndexed { index, (fromOrdinal, toOrdinal) ->
                        item {
                            where { (it.folderId eq thisId) and (it.ordinal greaterEq fromOrdinal) and (it.ordinal less toOrdinal) }
                            set(it.ordinal, it.ordinal minus (index + 1))
                        }
                    }
            }
            //再向后挪动空出位置
            data.db.update(FolderImageRelations) {
                where { (it.folderId eq thisId) and (it.ordinal greaterEq insertOrdinal) }
                set(it.ordinal, it.ordinal plus indexes.size)
            }
            //重新插入要移动的项
            data.db.batchInsert(FolderImageRelations) {
                //迭代这部分要移动的项目列表。迭代的是原始列表，没有经过排序
                indexes.forEachIndexed { index, thisIndex ->
                    //从map中取出对应的relation项
                    val imageId = itemMap[thisIndex]!!
                    item {
                        set(it.folderId, thisId)
                        set(it.ordinal, insertOrdinal + index)
                        set(it.imageId, imageId)
                    }
                }
            }
        }
    }

    /**
     * 删除一部分images。
     */
    fun deleteSubImages(indexes: List<Int>, thisId: Int) {
        if(indexes.isNotEmpty()) {
            val sortedIndexes = indexes.sorted()
            val count = data.db.sequenceOf(FolderImageRelations).count { it.folderId eq thisId }
            if(sortedIndexes.last() >= count) throw ResourceNotExist("itemIndexes", indexes.filter { it >= count })
            //删除
            data.db.delete(FolderImageRelations) { (it.folderId eq thisId) and (it.ordinal inList indexes) }
            //将余下的项向前缩进
            data.db.batchUpdate(FolderImageRelations) {
                sortedIndexes.asSequence()
                    .windowed(2, 1, true) { it[0] to it.getOrElse(1) { count } }
                    .forEachIndexed { index, (fromOrdinal, toOrdinal) ->
                        item {
                            where { (it.folderId eq thisId) and (it.ordinal greaterEq fromOrdinal) and (it.ordinal less toOrdinal) }
                            set(it.ordinal, it.ordinal minus (index + 1))
                        }
                    }
            }
        }
    }
}