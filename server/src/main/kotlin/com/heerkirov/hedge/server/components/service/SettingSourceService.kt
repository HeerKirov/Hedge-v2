package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.SourceOption
import com.heerkirov.hedge.server.components.database.saveMetadata
import com.heerkirov.hedge.server.components.database.syncMetadata
import com.heerkirov.hedge.server.definitions.supportedSourceSite
import com.heerkirov.hedge.server.exceptions.ResourceDuplicated
import com.heerkirov.hedge.server.form.SourceSiteForm
import com.heerkirov.hedge.server.utils.duplicateCount

class SettingSourceService(private val data: DataRepository) {
    fun getSupportedSites(): List<String> {
        return supportedSourceSite
    }

    fun getSites(): List<SourceOption.Site> {
        return data.metadata.source.sites
    }

    fun updateSites(sites: List<SourceSiteForm>) {
        val duplicates = sites.map { it.name }.duplicateCount().filter { (_, n) -> n > 1 }
        if(duplicates.isNotEmpty()) throw ResourceDuplicated("name", duplicates.keys)

        data.syncMetadata {
            data.saveMetadata {
                source.sites = sites.map { SourceOption.Site(it.name, it.title, it.hasId, it.hasSecondaryId) }
            }
        }
    }
}