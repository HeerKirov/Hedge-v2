package com.heerkirov.hedge.server.library.compiler.utils

data class IndexRange(val begin: Int, val end: Int? = null)

fun range(begin: Int, end: Int? = null) = IndexRange(begin, end)