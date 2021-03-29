package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.*
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.source.ImportImages
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.CascadeResourceExists
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.SiteCreateForm
import com.heerkirov.hedge.server.form.SiteUpdateForm
import org.ktorm.dsl.eq
import org.ktorm.entity.any
import org.ktorm.entity.sequenceOf

class SettingSourceService(private val data: DataRepository) {
    fun list(): List<SourceOption.Site> {
        return data.metadata.source.sites
    }

    fun create(form: SiteCreateForm) {
        data.syncMetadata {
            val sites = metadata.source.sites
            if(sites.any { it.name.equals(form.name, ignoreCase = true) }) throw AlreadyExists("Site", "name", form.name)

            val newSite = SourceOption.Site(form.name, form.title, form.hasSecondaryId)

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

    fun get(name: String): SourceOption.Site {
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
        data.db.transaction {
            val site = get(name)

            if(data.db.sequenceOf(Illusts).any { it.source eq name }) {
                throw CascadeResourceExists("Illust")
            }
            if(data.db.sequenceOf(ImportImages).any { it.source eq name }) {
                throw CascadeResourceExists("ImportImage")
            }
            if(data.metadata.import.sourceAnalyseRules.any { it.site == name }) {
                throw CascadeResourceExists("SourceAnalyseRule")
            }
            if(data.metadata.spider.rules.any { (site, _) -> site == name }) {
                throw CascadeResourceExists("SpiderRule")
            }

            data.syncMetadata {
                saveMetadata {
                    source.sites.remove(site)
                }
            }
        }
    }
}