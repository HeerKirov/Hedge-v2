package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.library.form.Length
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.Range
import com.heerkirov.hedge.server.model.illust.Illust
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
                                  @Range(min = 0 - 86400000, max = 86400000) val setPartitionTimeDelay: Opt<Long>,
                                  val sourceAnalyseRules: Opt<List<ImportOption.SourceAnalyseRule>>,
                                  val systemDownloadHistoryPath: Opt<String?>)

data class WebOptionUpdateForm(val autoWebAccess: Opt<Boolean>,
                               val permanent: Opt<Boolean>,
                               val password: Opt<String?>,
                               val access: Opt<Boolean>)

data class WebOptionRes(val autoWebAccess: Boolean, val permanent: Boolean, val password: String?, val access: Boolean)

data class ProxyOptionUpdateForm(val socks5Proxy: Opt<String?>,
                                 val httpProxy: Opt<String?>)


data class BackupOptionUpdateForm(val path: Opt<String?>,
                                  val autoBackup: Opt<Boolean>)