package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.FolderKit
import com.heerkirov.hedge.server.components.manager.FolderManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.collection.FolderImageRelations
import com.heerkirov.hedge.server.dao.collection.Folders
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.business.takeAllFilepath
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.anyOpt
import com.heerkirov.hedge.server.utils.types.descendingOrderItem
import com.heerkirov.hedge.server.utils.types.toListResult
import org.ktorm.dsl.*
import org.ktorm.entity.count
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class FolderService(private val data: DataRepository,
                    private val kit: FolderKit,
                    private val folderManager: FolderManager,
                    private val queryManager: QueryManager) {
    private val orderTranslator = OrderTranslator {
        "id" to Folders.id
        "title" to Folders.title
        "createTime" to Folders.createTime
        "updateTime" to Folders.updateTime
    }

    private val imagesOrderTranslator = OrderTranslator {
        "id" to Illusts.id
        "score" to Illusts.exportedScore
        "ordinal" to FolderImageRelations.ordinal
        "orderTime" to Illusts.orderTime
        "createTime" to Illusts.createTime
        "updateTime" to Illusts.updateTime
    }

    fun list(filter: FolderFilter): ListResult<FolderRes> {
        return data.db.from(Folders).select()
            .whereWithConditions {
                if(filter.isVirtualFolder != null) {
                    it += if(filter.isVirtualFolder) Folders.query.isNotNull() else Folders.query.isNull()
                }
                if(filter.search != null) {
                    it += Folders.title like "%${filter.search}%"
                }
            }
            .limit(filter.offset, filter.limit)
            .orderBy(orderTranslator, filter.order)
            .toListResult {
                val id = it[Folders.id]!!
                val title = it[Folders.title]!!
                val query = it[Folders.query]
                val isVirtualFolder = query != null
                val imageCount = if(isVirtualFolder) null else it[Folders.cachedCount]!!
                val createTime = it[Folders.createTime]!!
                val updateTime = it[Folders.updateTime]!!
                FolderRes(id, title, isVirtualFolder, imageCount, createTime, updateTime)
            }
    }

    /**
     * @throws AlreadyExists ("Folder", "name", string) 此名称的folder已存在
     * @throws ResourceNotExist ("images", number[]) 给出的images不存在。给出不存在的image id列表
     */
    fun create(form: FolderCreateForm): Int {
        data.db.transaction {
            return if(form.isVirtualFolder) {
                folderManager.newVirtualFolder(form.title, form.virtualQueryLanguage ?: "")
            }else{
                folderManager.newFolder(form.title, form.images ?: emptyList())
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): FolderDetailRes {
        val row = data.db.from(Folders)
            .select()
            .where { Folders.id eq id }
            .firstOrNull()
            ?: throw be(NotFound())

        val title = row[Folders.title]!!
        val query = row[Folders.query]
        val isVirtualFolder = query != null
        val imageCount = if(isVirtualFolder) null else row[Folders.cachedCount]!!
        val createTime = row[Folders.createTime]!!
        val updateTime = row[Folders.updateTime]!!

        return FolderDetailRes(id, title, isVirtualFolder, query, imageCount, createTime, updateTime)
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws AlreadyExists ("Folder", "name", string) 此名称的folder已存在
     */
    fun update(id: Int, form: FolderUpdateForm) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { it.id eq id } ?: throw be(NotFound())

            form.title.letOpt { kit.validateTitle(it, thisId = id) }
            if(form.virtualQueryLanguage.isPresent && folder.query == null) throw be(ParamNotRequired("virtualQueryLanguage"))

            if(anyOpt(form.title, form.virtualQueryLanguage)) {
                data.db.update(Folders) {
                    where { it.id eq id }
                    form.title.applyOpt { set(it.title, this) }
                    form.virtualQueryLanguage.applyOpt { set(it.query, this) }
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { it.id eq id } ?: throw be(NotFound())

            data.db.delete(Folders) { it.id eq id }
            if(folder.query == null) data.db.delete(FolderImageRelations) { it.folderId eq id }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun getImages(id: Int, filter: FolderImagesFilter): ListResult<FolderImageRes> {
        val row = data.db.from(Folders).select(Folders.query).where { Folders.id eq id }.firstOrNull() ?: throw be(NotFound())
        val query = row[Folders.query]

        return if(query == null) getSubItemImages(id, filter) else getVirtualQueryResult(query, filter)
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws Reject 试图给虚拟文件夹更新images时抛出此错误
     * @throws ResourceNotExist ("images", number[]) 给出的images不存在。给出不存在的image id列表
     */
    fun updateImages(id: Int, images: List<Int>) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { Folders.id eq id } ?: throw be(NotFound())
            if(folder.query != null) throw be(Reject("Cannot update images for virtual-folder."))

            kit.validateSubImages(images)

            data.db.update(Folders) {
                where { it.id eq id }
                set(it.cachedCount, images.size)
                set(it.updateTime, DateTime.now())
            }

            kit.processSubImages(images, id)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws Reject 试图给虚拟文件夹更新images时抛出此错误
     * @throws ResourceNotExist ("images", number[]) 给出的images不存在。给出不存在的image id列表
     * @throws ResourceNotExist ("itemIndexes", number[]) 要操作的image index不存在。给出不存在的index列表
     */
    fun partialUpdateImages(id: Int, form: FolderImagesPartialUpdateForm) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { Folders.id eq id } ?: throw be(NotFound())
            if(folder.query != null) throw be(Reject("Cannot update images for virtual-folder."))

            when (form.action) {
                BatchAction.ADD -> {
                    val images = form.images ?: throw be(ParamRequired("images"))
                    kit.validateSubImages(images)
                    kit.insertSubImages(images, id, form.ordinal)
                }
                BatchAction.MOVE -> {
                    val itemIndexes = form.itemIndexes ?: throw be(ParamRequired("itemIndexes"))
                    if(itemIndexes.isNotEmpty()) {
                        kit.moveSubImages(itemIndexes, id, form.ordinal)
                    }
                }
                BatchAction.DELETE -> {
                    val itemIndexes = form.itemIndexes ?: throw be(ParamRequired("itemIndexes"))
                    if (itemIndexes.isNotEmpty()) {
                        kit.deleteSubImages(itemIndexes, id)
                    }
                }
            }
        }
    }

    fun getPinFolders(): List<FolderPinRes> {
        return data.db.from(Folders).select(Folders.id, Folders.title, Folders.query.isNotNull().aliased("virtual"))
            .where { Folders.pin.isNotNull() }
            .orderBy(Folders.pin.asc())
            .map { FolderPinRes(it[Folders.id]!!, it[Folders.title]!!, it.getBoolean("virtual")) }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun updatePinFolder(id: Int, form: FolderPinForm) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { it.id eq id } ?: throw be(NotFound())
            if((form.ordinal == null && folder.pin != null) || (form.ordinal != null && folder.pin == form.ordinal)) return

            val count = data.db.sequenceOf(Folders).count { it.pin.isNotNull() }
            if(folder.pin == null) {
                //insert
                val ordinal = if(form.ordinal != null && form.ordinal < count) form.ordinal else count

                data.db.update(Folders) {
                    where { it.pin.isNotNull() and (it.pin greaterEq ordinal) }
                    set(it.pin, it.pin plus 1)
                }
                data.db.update(Folders) {
                    where { it.id eq id }
                    set(it.pin, ordinal)
                }
            }else{
                //update
                val ordinal = if(form.ordinal!! < count) form.ordinal else count

                if(ordinal > form.ordinal) {
                    data.db.update(Folders) {
                        where { it.pin.isNotNull() and (it.pin greater form.ordinal) and (it.pin lessEq ordinal) }
                        set(it.pin, it.pin minus 1)
                    }
                }else{
                    data.db.update(Folders) {
                        where { it.pin.isNotNull() and (it.pin greaterEq ordinal) and (it.pin less form.ordinal) }
                        set(it.pin, it.pin plus 1)
                    }
                }
                data.db.update(Folders) {
                    where { it.id eq id }
                    set(it.pin, ordinal)
                }
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws Reject 此folder没有被pin，因此不能删除pin
     */
    fun deletePinFolder(id: Int) {
        data.db.transaction {
            val folder = data.db.sequenceOf(Folders).firstOrNull { it.id eq id } ?: throw be(NotFound())
            if(folder.pin == null) throw be(Reject("Folder is not pinned."))

            data.db.update(Folders) {
                where { it.id eq id }
                set(it.pin, null)
            }
        }
    }

    private fun getSubItemImages(id: Int, filter: FolderImagesFilter): ListResult<FolderImageRes> {
        return data.db.from(FolderImageRelations)
            .innerJoin(Illusts, FolderImageRelations.imageId eq Illusts.id)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(FolderImageRelations.ordinal, Illusts.id,
                Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { FolderImageRelations.folderId eq id }
            .limit(filter.offset, filter.limit)
            .orderBy(imagesOrderTranslator, filter.order)
            .toListResult {
                val ordinal = it[FolderImageRelations.ordinal]!!
                val itemId = it[Illusts.id]!!
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                FolderImageRes(ordinal, itemId, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }

    private fun getVirtualQueryResult(query: String, filter: FolderImagesFilter): ListResult<FolderImageRes> {
        //在虚拟文件夹查询中，filter只有limit, offset参数生效。
        val schema = if(query.isBlank()) null else {
            queryManager.querySchema(query, QueryManager.Dialect.ILLUST).executePlan ?: return ListResult(0, emptyList())
        }
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .select(Illusts.id, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .whereWithConditions {
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(Illusts.id) }
            .limit(filter.offset, filter.limit)
            .orderBy(imagesOrderTranslator, null, schema?.orderConditions, default = descendingOrderItem("orderTime"))
            .toListResult {
                val itemId = it[Illusts.id]!!
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                FolderImageRes(null, itemId, file, thumbnailFile, score, favorite, tagme, orderTime)
            }
    }
}