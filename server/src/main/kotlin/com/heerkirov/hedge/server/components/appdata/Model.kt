package com.heerkirov.hedge.server.components.appdata

data class AppData(
    val service: ServiceOption,
    val web: WebOption,
    val proxy: ProxyOption
)

data class ServiceOption(
    var port: String?
)

data class WebOption(
    var autoWebAccess: Boolean,
    var permanent: Boolean,
    var password: String?
)

data class ProxyOption(
    var socks5Proxy: String?,
    var httpProxy: String?
)