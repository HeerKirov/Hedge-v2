package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.exceptions.InvalidRuleIndexError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.utils.toBaseElements

class SettingImportService(private val data: DataRepository) {
    fun get(): ImportOption {
        return data.metadata.import
    }

    fun update(form: ImportOptionUpdateForm) {
        data.syncMetadata {
            form.sourceAnalyseRules.alsoOpt { rules ->
                val sites = metadata.source.sites.map { Pair(it.name, it) }.toMap()

                for (rule in rules) {
                    val site = sites[rule.site] ?: throw ResourceNotExist("site", rule.site)
                    checkImportRule(rule, site)
                }
            }

            saveMetadata {
                form.autoAnalyseMeta.alsoOpt { import.autoAnalyseMeta = it }
                form.setTagmeOfTag.alsoOpt { import.setTagmeOfTag = it }
                form.setTagmeOfSource.alsoOpt { import.setTagmeOfSource = it }
                form.setTimeBy.alsoOpt { import.setTimeBy = it }
                form.setPartitionTimeDelay.alsoOpt { import.setPartitionTimeDelay = it }
                form.systemDownloadHistoryPath.alsoOpt { import.systemDownloadHistoryPath = it }
                form.sourceAnalyseRules.alsoOpt { import.sourceAnalyseRules = it }
            }
        }
    }

    private fun checkImportRule(rule: ImportOption.SourceAnalyseRule, site: SourceOption.Site) {
        if(rule is ImportOption.SourceAnalyseRuleOfRegex) {
            if((rule.secondaryIdIndex != null) xor site.hasSecondaryId) throw InvalidRuleIndexError(site.name, rule.regex)
        }
    }
}