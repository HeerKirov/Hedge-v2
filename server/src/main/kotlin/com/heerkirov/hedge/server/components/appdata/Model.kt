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

fun defaultValue(dbPath: String): AppData {
    return AppData(
        service = ServiceOption(port = null),
        web = WebOption(autoWebAccess = false, permanent = false, password = null),
        db = DBOption(dbPath),
        backup = BackupOption(path = null, lastUpdate = null, autoBackup = false)
    )
}