package com.heerkirov.hedge.server.components.appdata

data class AppData(
    val service: ServiceOption,
    val web: WebOption,
    val db: DBOption,
    val backup: BackupOption
)

data class ServiceOption(
    val port: String?
)

data class WebOption(
    val autoWebAccess: Boolean,
    val permanent: Boolean,
    val password: String?
)

data class DBOption(
    val path: String
)

data class BackupOption(
    val path: String?,
    val lastUpdate: Long?,
    val autoBackup: Boolean
)

fun defaultValue(dbPath: String): AppData {
    return AppData(
        service = ServiceOption(port = null),
        web = WebOption(autoWebAccess = false, permanent = false, password = null),
        db = DBOption(dbPath),
        backup = BackupOption(path = null, lastUpdate = null, autoBackup = false)
    )
}