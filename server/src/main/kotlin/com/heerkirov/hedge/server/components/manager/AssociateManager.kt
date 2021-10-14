package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.illust.Associates
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.dto.AssociateRes
import com.heerkirov.hedge.server.dto.IllustRes
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.business.takeAllFilepath
import com.heerkirov.hedge.server.utils.DateTime.parseDateTime
import org.ktorm.dsl.*
import org.ktorm.entity.first
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class AssociateManager(private val data: DataRepository) {
    /**
     * 这些illusts即将从它们原本所属的associate移出，因此需要处理这个移出对原本所属associate的影响。
     */
    fun processTransform(illusts: List<Int>) {
        val items = data.db.from(Illusts).select(Illusts.id, Illusts.associateId)
            .where { (Illusts.id inList illusts) and (Illusts.associateId.isNotNull()) }
            .map { Pair(it[Illusts.id]!!, it[Illusts.associateId]!!) }

        val groups = items.groupingBy { it.second }.eachCount()

        data.db.batchUpdate(Associates) {
            for((associateId, cnt) in groups) {
                item {
                    where { it.id eq associateId }
                    set(it.cachedCount, it.cachedCount minus cnt)
                }
            }
        }

        data.db.delete(Associates) {
            (it.id inList groups.keys) and (it.cachedCount lessEq 0)
        }
    }

    /**
     * 查询来自associate的项目并组成res。
     */
    fun query(associateId: Int?, limit: Int?): AssociateRes? {
        if(associateId == null) return null

        val associate = data.db.sequenceOf(Associates).firstOrNull { it.id eq associateId } ?: return null

        val illusts = data.db.from(Illusts)
            .innerJoin(FileRecords, Illusts.fileId eq FileRecords.id)
            .select(Illusts.id, Illusts.type, Illusts.exportedScore, Illusts.favorite, Illusts.tagme, Illusts.orderTime, Illusts.cachedChildrenCount,
                FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.associateId eq associateId }
            .limit(0, limit)
            .orderBy(Illusts.orderTime.asc())
            .map {
                val id = it[Illusts.id]!!
                val type = if(it[Illusts.type]!! == Illust.Type.COLLECTION) Illust.IllustType.COLLECTION else Illust.IllustType.IMAGE
                val score = it[Illusts.exportedScore]
                val favorite = it[Illusts.favorite]!!
                val tagme = it[Illusts.tagme]!!
                val orderTime = it[Illusts.orderTime]!!.parseDateTime()
                val (file, thumbnailFile) = takeAllFilepath(it)
                val childrenCount = it[Illusts.cachedChildrenCount]!!.takeIf { type == Illust.IllustType.COLLECTION }
                IllustRes(id, type, childrenCount, file, thumbnailFile, score, favorite, tagme, orderTime)
            }

        return AssociateRes(associateId, associate.cachedCount, illusts)
    }

    /**
     * 为illust更换associate。
     * @throws ResourceNotExist ("associateId", number) 新id指定的associate不存在。给出id
     */
    fun changeAssociate(illust: Illust, newAssociateId: Int?) {
        val targetAssociate = if(newAssociateId == null) null else {
            data.db.sequenceOf(Associates).firstOrNull { it.id eq newAssociateId } ?: throw be(ResourceNotExist("associateId", newAssociateId))
        }

        removeFromAssociate(illust)

        data.db.update(Illusts) {
            where { it.id eq illust.id }
            set(it.associateId, newAssociateId)
        }

        if(targetAssociate != null) {
            data.db.update(Associates) {
                where { it.id eq targetAssociate.id }
                set(it.cachedCount, targetAssociate.cachedCount + 1)
            }
        }
    }

    /**
     * 将一个illust从associate移除。
     */
    fun removeFromAssociate(illust: Illust) {
        if(illust.associateId != null) {
            val associate = data.db.sequenceOf(Associates).first { it.id eq illust.associateId }
            if(associate.cachedCount > 1) {
                data.db.update(Associates) {
                    where { it.id eq associate.id }
                    set(it.cachedCount, associate.cachedCount - 1)
                }
            }else{
                data.db.delete(Associates) {
                    it.id eq associate.id
                }
            }
        }
    }
}