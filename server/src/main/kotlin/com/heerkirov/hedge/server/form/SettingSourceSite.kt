package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.library.form.NotBlank
import com.heerkirov.hedge.server.utils.types.Opt

data class SiteCreateForm(@NotBlank val name: String,
                          @NotBlank val title: String,
                          val hasId: Boolean = true,
                          val hasSecondaryId: Boolean = false,
                          val ordinal: Int? = null)

data class SiteUpdateForm(@NotBlank val title: Opt<String>,
                          val ordinal: Opt<Int>)