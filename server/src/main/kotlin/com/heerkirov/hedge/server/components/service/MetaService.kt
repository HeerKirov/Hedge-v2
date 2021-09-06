package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.MetaManager
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dto.MetaTagValidateRes
import com.heerkirov.hedge.server.dto.TagSimpleRes
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.meta.Tag
import org.ktorm.dsl.inList
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList

class MetaService(private val data: DataRepository, private val metaManager: MetaManager) {
    fun validateTags(tagIds: List<Int>): MetaTagValidateRes {
        val tags = data.db.sequenceOf(Tags).filter { it.id inList tagIds }.toList()
        if(tags.size < tags.size) {
            throw ResourceNotExist("tags", tagIds.toSet() - tags.asSequence().map { it.id }.toSet())
        }

        //只允许设定类型为TAG的标签，不允许地址段。
        val notSuitable = tags.filter { it.type != Tag.Type.TAG }.map { TagSimpleRes(it.id, it.name, it.color, false) }

        //检查冲突组限制，提出警告和错误
        val conflictingMembers: MutableList<ConflictingGroupMembersError.ConflictingMembers> = ArrayList()
        val forceConflictingMembers: MutableList<ConflictingGroupMembersError.ConflictingMembers> = ArrayList()
        try {
            metaManager.exportTag(tags, conflictingMembersCheck = true, onlyForceConflicting = false)
        }catch (e: ConflictingGroupMembersError) {
            @Suppress("UNCHECKED_CAST")
            val members = (e.info as List<ConflictingGroupMembersError.ConflictingMembers>)
            forceConflictingMembers.addAll(members.filter { it.force })
            conflictingMembers.addAll(members.filterNot { it.force })
        }

        return MetaTagValidateRes(notSuitable, conflictingMembers, forceConflictingMembers)
    }
}