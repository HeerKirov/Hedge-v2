package com.heerkirov.hedge.server.library.compiler.utils

data class AnalysisResult<T, E>(val result: T?, val warnings: List<E> = emptyList(), val errors: List<E> = emptyList())