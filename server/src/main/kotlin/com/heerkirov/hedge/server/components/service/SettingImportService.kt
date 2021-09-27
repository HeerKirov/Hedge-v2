package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.exceptions.InvalidRuleIndexError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.dto.ImportOptionUpdateForm
import com.heerkirov.hedge.server.exceptions.be

class SettingImportService(private val data: DataRepository) {
    fun get(): ImportOption {
        return data.metadata.import
    }

    /**
     * @throws ResourceNotExist ("site", string) rules中有给出的site不存在
     * @throws InvalidRuleIndexError (string, string) rules的index与regex不匹配
     */
    fun update(form: ImportOptionUpdateForm) {
        data.syncMetadata {
            form.sourceAnalyseRules.alsoOpt { rules ->
                val sites = metadata.source.sites.associateBy { it.name }

                for (rule in rules) {
                    val site = sites[rule.site] ?: throw be(ResourceNotExist("site", rule.site))
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

    /**
     * @throws InvalidRuleIndexError (string, string) rule的index与regex不匹配
     */
    private fun checkImportRule(rule: ImportOption.SourceAnalyseRule, site: SourceOption.Site) {
        if(rule is ImportOption.SourceAnalyseRuleOfRegex) {
            if((rule.secondaryIdIndex != null) xor site.hasSecondaryId) throw be(InvalidRuleIndexError(site.name, rule.regex))
        }
    }
}