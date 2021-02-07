package com.heerkirov.hedge.server.library.compiler.translator

import com.heerkirov.hedge.server.library.compiler.semantic.plan.QueryPlan
import com.heerkirov.hedge.server.library.compiler.translator.executor.Executor
import com.heerkirov.hedge.server.library.compiler.translator.visual.VisualQueryPlan
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError

/**
 * 执行计划翻译器。执行查询计划 -> 执行计划 & 可视化查询计划的过程。
 */
object Translator {
    /**
     * 执行翻译。
     * @param queryPlan 输入参数，查询计划。
     */
    fun <T : Any> parse(queryPlan: QueryPlan, executor: Executor<T>): AnalysisResult<TranslatorResult<T>, TranslatorError<*>> {
        TODO()
    }

    data class TranslatorResult<T : Any>(val visualQueryPlan: VisualQueryPlan, val executorPlan: T)
}