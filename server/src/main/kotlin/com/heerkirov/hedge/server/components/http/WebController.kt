package com.heerkirov.hedge.server.components.http

/**
 * 拆分出来的web访问控制器。
 */
interface WebController {
    var isAccess: Boolean
}

class WebControllerImpl : WebController {
    override var isAccess: Boolean = false
}