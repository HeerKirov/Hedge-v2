package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.AssociateManager
import com.heerkirov.hedge.server.dao.illust.Associates
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.dto.IllustRes
import com.heerkirov.hedge.server.dto.LimitAndOffsetFilter
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.business.takeAllFilepath
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import org.ktorm.dsl.*

class AssociateService(private val data: DataRepository, private val associateManager: AssociateManager) {

    fun create(illusts: List<Int>): Int {
        if(illusts.isEmpty()) throw be(ParamError("illusts"))
        data.db.transaction {
            val id = data.db.insertAndGenerateKey(Associates) {
                set(it.cachedCount, illusts.size)
            } as Int

            //更换关联项的associateId，并对旧associate执行移除流程
            associateManager.processTransform(illusts)
            data.db.update(Illusts) {
                where { it.id inList illusts }
                set(it.associateId, id)
            }

            return id
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(associateId: Int, filter: LimitAndOffsetFilter): ListResult<IllustRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime, Illusts.cachedChildrenCount,
                Illusts.source, Illusts.sourceId, Illusts.sourcePart,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.associateId eq associateId }
            .limit(filter.offset, filter.limit)
            .orderBy(Illusts.orderTime.asc())
            .toListResult {
                val id = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                val childrenCount = it[Illusts.cachedChildrenCount]!!.takeIf { type == Illust.IllustType.COLLECTION }
                val source = it[Illusts.source]
                val sourceId = it[Illusts.sourceId]
                val sourcePart = it[Illusts.sourcePart]
                IllustRes(id, type, childrenCount, file, thumbnailFile, score, favorite, tagme, source, sourceId, sourcePart, orderTime)
            }.also {
                if(it.total <= 0) throw be(NotFound())
            }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun update(associateId: Int, illusts: List<Int>) {
        if(illusts.isEmpty()) throw be(ParamError("illusts"))

        data.db.transaction {

            val currentIllusts = data.db.from(Illusts).select(Illusts.id)
                .where { Illusts.associateId eq associateId }
                .map { it[Illusts.id]!! }

            if(currentIllusts.isEmpty()) throw be(NotFound())

            //清空移除的关联项的associateId
            val remove = currentIllusts - illusts
            data.db.update(Illusts) {
                where { it.id inList remove }
                set(it.associateId, null)
            }

            //新加入的关联项更换associateId，并对旧associateId执行移除流程
            val add = illusts - currentIllusts
            associateManager.processTransform(add)
            data.db.update(Illusts) {
                where { it.id inList illusts }
                set(it.associateId, associateId)
            }

            data.db.update(Associates) {
                where { it.id eq associateId }
                set(it.cachedCount, illusts.size)
            }
        }
    }

    fun delete(associateId: Int) {
        data.db.transaction {
            //清空关联项的associateId
            data.db.update(Illusts) {
                where { it.associateId eq associateId }
                set(it.associateId, null)
            }
            data.db.delete(Associates) {
                it.id eq associateId
            }
        }
    }
}