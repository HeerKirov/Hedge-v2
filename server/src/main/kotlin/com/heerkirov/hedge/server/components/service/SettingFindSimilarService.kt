package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.FindSimilarOption
import com.heerkirov.hedge.server.components.database.saveMetadata
import com.heerkirov.hedge.server.components.database.syncMetadata
import com.heerkirov.hedge.server.dto.FindSimilarOptionUpdateForm

class SettingFindSimilarService(private val data: DataRepository) {
    fun get(): FindSimilarOption {
        return data.metadata.findSimilar
    }

    fun update(form: FindSimilarOptionUpdateForm) {
        data.syncMetadata {
            data.saveMetadata {
                form.autoFindSimilar.alsoOpt { findSimilar.autoFindSimilar = it }
                form.autoTaskConf.alsoOpt { findSimilar.autoTaskConf = it }
                form.defaultTaskConf.alsoOpt { findSimilar.defaultTaskConf = it }
            }
        }
    }
}