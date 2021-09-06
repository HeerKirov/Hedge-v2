package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.exceptions.BaseException
import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset

data class ErrorResult(val code: String, val message: String?, val info: Any?) {
    constructor(e: BaseException): this(e.code, e.message, e.info)
}

data class IdRes(val id: Int)

data class IdResWithWarnings(val id: Int, val warnings: List<ErrorResult>)

data class LimitAndOffsetFilter(@Limit val limit: Int,
                                @Offset val offset: Int)

data class LimitFilter(@Limit val limit: Int)

enum class BatchAction {
    ADD, MOVE, DELETE
}