package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.library.compiler.translator.visual.VisualQueryPlan
import com.heerkirov.hedge.server.library.compiler.utils.CompileError

data class QueryForm(val text: String, val dialect: QueryManager.Dialect)

data class QueryRes(val queryPlan: VisualQueryPlan?, val warnings: List<CompileError<*>>, val errors: List<CompileError<*>>)