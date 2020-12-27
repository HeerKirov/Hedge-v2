package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.Range
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.types.Opt

data class SourceSiteForm(@NotBlank val name: String, @NotBlank val title: String, val hasId: Boolean = true, val hasSecondaryId: Boolean = false)

data class ImportOptionUpdateForm(val autoAnalyseMeta: Opt<Boolean>,
                                  val setTagme: Opt<Illust.Tagme>,
                                  val setCreateTimeBy: Opt<ImportOption.TimeType>,
                                  @Range(min = 0 - 86400000, max = 86400000) val setPartitionTimeDelay: Opt<Long>,
                                  val sourceAnalyseRules: Opt<List<ImportOption.SourceAnalyseRule>>,
                                  val systemDownloadHistoryPath: Opt<String?>)