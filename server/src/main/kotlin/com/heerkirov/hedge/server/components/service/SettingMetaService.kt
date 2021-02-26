package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.exceptions.InvalidRuleIndexError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.form.MetaOptionUpdateForm
import com.heerkirov.hedge.server.utils.toBaseElements

class SettingMetaService(private val data: DataRepository) {
    fun get(): MetaOption {
        return data.metadata.meta
    }

    fun update(form: MetaOptionUpdateForm) {
        data.syncMetadata {
            saveMetadata {
                form.autoCleanTagme.alsoOpt { meta.autoCleanTagme = it }
                form.scoreMaximum.alsoOpt { meta.scoreMaximum = it }
                form.scoreDescriptions.alsoOpt { meta.scoreDescriptions = it }
            }
        }
    }
}