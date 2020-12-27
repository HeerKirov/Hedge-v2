package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.components.database.saveMetadata
import com.heerkirov.hedge.server.components.database.syncMetadata
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.utils.toBaseElements

class SettingImportService(private val data: DataRepository) {
    fun get(): ImportOption {
        return data.metadata.import
    }

    fun update(form: ImportOptionUpdateForm) {
        data.syncMetadata {
            data.saveMetadata {
                form.autoAnalyseMeta.alsoOpt { import.autoAnalyseMeta = it }
                form.setTagme.alsoOpt { import.setTagme = it.toBaseElements().map { i -> i.toString() } }
                form.setCreateTimeBy.alsoOpt { import.setCreateTimeBy = it }
                form.setPartitionTimeDelay.alsoOpt { import.setPartitionTimeDelay = it }
                form.systemDownloadHistoryPath.alsoOpt { import.systemDownloadHistoryPath = it }
                form.sourceAnalyseRules.alsoOpt { import.sourceAnalyseRules = it }
            }
        }
    }
}