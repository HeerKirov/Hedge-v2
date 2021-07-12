package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.dto.MetaOptionUpdateForm

class SettingMetaService(private val data: DataRepository) {
    fun get(): MetaOption {
        return data.metadata.meta
    }

    fun update(form: MetaOptionUpdateForm) {
        data.syncMetadata {
            saveMetadata {
                form.autoCleanTagme.alsoOpt { meta.autoCleanTagme = it }
                form.scoreDescriptions.alsoOpt { meta.scoreDescriptions = it }
                form.topicColors.alsoOpt { meta.topicColors = it }
                form.authorColors.alsoOpt { meta.authorColors = it }
            }
        }
    }
}