package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.exceptions.InvalidRuleIndexError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.form.ImportOptionUpdateForm
import com.heerkirov.hedge.server.form.MetaOptionUpdateForm
import com.heerkirov.hedge.server.form.SpiderOptionUpdateForm
import com.heerkirov.hedge.server.utils.toBaseElements

class SettingSpiderService(private val data: DataRepository) {
    private val ruleList = listOf("pixiv", "complex")

    fun getSpiderRuleList(): List<String> {
        return ruleList
    }

    fun get(): SpiderOption {
        return data.metadata.spider
    }

    fun update(form: SpiderOptionUpdateForm) {
        data.syncMetadata {
            form.rules.alsoOpt { rules ->
                for ((siteName, spiderRuleName) in rules) {
                    if(metadata.source.sites.none { it.name == siteName }) throw ResourceNotExist("rules.site", siteName)
                    else if(spiderRuleName !in ruleList) throw ResourceNotExist("rules.name", spiderRuleName)
                }
            }
            form.siteRules.alsoOpt { siteRules ->
                for ((siteName, _) in siteRules) {
                    if(metadata.source.sites.none { it.name === siteName }) throw ResourceNotExist("siteRules.site", siteName)
                }
            }

            saveMetadata {
                form.rules.alsoOpt { spider.rules = it }
                form.publicRule.alsoOpt { spider.publicRule = it }
                form.siteRules.alsoOpt { spider.siteRules = it }
            }
        }
    }
}