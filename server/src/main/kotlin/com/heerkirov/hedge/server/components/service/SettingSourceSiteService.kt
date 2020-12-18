package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.SourceOption
import com.heerkirov.hedge.server.components.database.saveMetadata
import com.heerkirov.hedge.server.components.database.syncMetadata
import com.heerkirov.hedge.server.definitions.supportedSourceSite
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.SiteCreateForm
import com.heerkirov.hedge.server.form.SiteUpdateForm

class SettingSourceSiteService(private val data: DataRepository) {
    fun supportedSiteList(): List<String> {
        return supportedSourceSite
    }

    fun list(): List<SourceOption.SiteItem> {
        return data.metadata.source.sites
    }

    fun create(form: SiteCreateForm) {
        data.syncMetadata {
            val sites = metadata.source.sites
            if(sites.any { it.name.equals(form.name, ignoreCase = true) }) throw AlreadyExists("Site", "name", form.name)

            val newSite = SourceOption.SiteItem(form.name, form.title, form.hasId, form.hasSecondaryId)

            val ordinal = form.ordinal?.let {
                when {
                    it < 0 -> 0
                    it >= sites.size -> null
                    else -> it
                }
            }

            saveMetadata {
                if(ordinal != null) {
                    sites.add(ordinal, newSite)
                }else{
                    sites.add(newSite)
                }
            }
        }
    }

    fun get(name: String): SourceOption.SiteItem {
        return data.metadata.source.sites.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: throw NotFound()
    }

    fun update(name: String, form: SiteUpdateForm) {
        data.syncMetadata {
            val site = get(name)

            saveMetadata {
                form.title.alsoOpt { site.title = it }
                form.ordinal.alsoOpt {
                    val sites = data.metadata.source.sites
                    val newOrdinal = when {
                        it < 0 -> 0
                        it > sites.size -> sites.size
                        else -> it
                    }
                    val oldOrdinal = sites.indexOf(site)

                    if(oldOrdinal < newOrdinal) {
                        data.metadata.source.sites.apply {
                            clear()
                            addAll(sites.subList(0, oldOrdinal) + sites.subList(oldOrdinal + 1, newOrdinal) + site + sites.subList(newOrdinal, sites.size))
                        }
                    }else if(oldOrdinal > newOrdinal) {
                        data.metadata.source.sites.apply {
                            clear()
                            addAll(sites.subList(0, newOrdinal) + site + sites.subList(newOrdinal, oldOrdinal) + site + sites.subList(oldOrdinal + 1, sites.size))
                        }
                    }
                }
            }
        }
    }

    fun delete(name: String) {
        data.syncMetadata {
            val site = get(name)

            saveMetadata {
                source.sites.remove(site)
            }
        }
    }
}