package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.components.database.MetaOption
import com.heerkirov.hedge.server.components.database.SpiderOption
import com.heerkirov.hedge.server.library.form.Length
import com.heerkirov.hedge.server.library.form.Min
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.Range
import com.heerkirov.hedge.server.model.meta.Author
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.types.Opt

data class SiteCreateForm(@NotBlank @Length(16) val name: String,
                          @NotBlank val title: String,
                          val hasSecondaryId: Boolean = false,
                          val ordinal: Int? = null)

data class SiteUpdateForm(@NotBlank val title: Opt<String>,
                          val ordinal: Opt<Int>)

data class ImportOptionUpdateForm(val autoAnalyseMeta: Opt<Boolean>,
                                  val setTagmeOfTag: Opt<Boolean>,
                                  val setTagmeOfSource: Opt<Boolean>,
                                  val setTimeBy: Opt<ImportOption.TimeType>,
                                  @Range(min = 0 - 86400000, max = 86400000) val setPartitionTimeDelay: Opt<Long?>,
                                  val sourceAnalyseRules: Opt<List<ImportOption.SourceAnalyseRule>>,
                                  val systemDownloadHistoryPath: Opt<String?>)

data class MetaOptionUpdateForm(val scoreDescriptions: Opt<List<MetaOption.ScoreDescription>>,
                                val autoCleanTagme: Opt<Boolean>,
                                val topicColors: Opt<Map<Topic.Type, String>>,
                                val authorColors: Opt<Map<Author.Type, String>>)

data class QueryOptionUpdateForm(val chineseSymbolReflect: Opt<Boolean>,
                                 val translateUnderscoreToSpace: Opt<Boolean>,
                                 @Min(1) val queryLimitOfQueryItems: Opt<Int>,
                                 @Min(2) val warningLimitOfUnionItems: Opt<Int>,
                                 @Min(2) val warningLimitOfIntersectItems: Opt<Int>)

data class SpiderOptionUpdateForm(val rules: Opt<Map<String, String>>,
                                  val publicRule: Opt<SpiderOption.SpiderRule>,
                                  val siteRules: Opt<Map<String, SpiderOption.SpiderRule>>)

data class WebOptionUpdateForm(val autoWebAccess: Opt<Boolean>,
                               val permanent: Opt<Boolean>,
                               val password: Opt<String?>,
                               val access: Opt<Boolean>)

data class WebOptionRes(val autoWebAccess: Boolean, val permanent: Boolean, val password: String?, val access: Boolean)

data class ProxyOptionUpdateForm(val socks5Proxy: Opt<String?>,
                                 val httpProxy: Opt<String?>)