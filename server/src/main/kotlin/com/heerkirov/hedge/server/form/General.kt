package com.heerkirov.hedge.server.form

import com.heerkirov.hedge.server.exceptions.BaseException

data class ErrorResult(val code: String, val message: String?, val info: Any?) {
    constructor(e: BaseException): this(e.code, e.message, e.info)
}

data class IdRes(val id: Int)

data class IdResWithWarnings(val id: Int, val warnings: List<ErrorResult>)

data class WarningsRes(val warnings: List<ErrorResult>)