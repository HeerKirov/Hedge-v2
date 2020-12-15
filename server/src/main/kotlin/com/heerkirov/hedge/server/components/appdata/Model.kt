package com.heerkirov.hedge.server.components.appdata

data class AppData(
    val service: ServiceOption,
    val web: WebOption,
    val db: DBOption,
    val backup: BackupOption
)

data class ServiceOption(
    var port: String?
)

data class WebOption(
    var autoWebAccess: Boolean,
    var permanent: Boolean,
    var password: String?
)

data class DBOption(
    var path: String
)

data class BackupOption(
    var path: String?,
    var lastUpdate: Long?,
    var autoBackup: Boolean
)