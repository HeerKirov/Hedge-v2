package com.heerkirov.hedge.server.library.compiler.utils

data class AnalysisResult<T, E>(val result: T?, val warnings: List<E> = emptyList(), val errors: List<E> = emptyList()) {
    override fun toString(): String {
        return "{\nresult=$result\nwarnings=$warnings\nerrors=$errors\n}"
    }
}