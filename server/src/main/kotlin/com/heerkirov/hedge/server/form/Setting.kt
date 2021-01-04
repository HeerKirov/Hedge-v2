package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.library.form.Range
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt

data class SiteCreateForm(@NotBlank val name: String,
                          @NotBlank val title: String,
                          val hasSecondaryId: Boolean = false,
                          val ordinal: Int? = null)

data class SiteUpdateForm(@NotBlank val title: Opt<String>,
                          val ordinal: Opt<Int>)

data class ImportOptionUpdateForm(val autoAnalyseMeta: Opt<Boolean>,
                                  val setTagme: Opt<Illust.Tagme>,
                                  val setTimeBy: Opt<ImportOption.TimeType>,
                                  @Range(min = 0 - 86400000, max = 86400000) val setPartitionTimeDelay: Opt<Long>,
                                  val sourceAnalyseRules: Opt<List<ImportOption.SourceAnalyseRule>>,
                                  val systemDownloadHistoryPath: Opt<String?>)