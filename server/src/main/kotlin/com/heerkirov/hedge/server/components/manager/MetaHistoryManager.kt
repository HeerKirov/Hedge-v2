package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dto.MetaUtilIdentity
import com.heerkirov.hedge.server.enums.IdentityType
import com.heerkirov.hedge.server.enums.MetaType

class MetaHistoryManager(private val data: DataRepository) {
    fun getIdentities(): List<MetaUtilIdentity> {
        TODO()
    }

    fun addIdentity(type: IdentityType, id: Int) {
        TODO()
    }

    fun getMetasByRecent(): Map<MetaType, List<Int>> {
        TODO()
    }

    fun getMetasByFrequent(): Map<MetaType, List<Int>> {
        TODO()
    }

    fun addMeta(type: MetaType, id: Int) {
        TODO()
    }
}