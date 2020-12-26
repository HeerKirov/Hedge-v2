package com.heerkirov.hedge.server.components.appdata

import com.fasterxml.jackson.databind.JsonNode
import com.heerkirov.hedge.server.utils.migrations.JsonObjectStrategy
import com.heerkirov.hedge.server.utils.migrations.MigrationRegister

object AppDataMigrationStrategy : JsonObjectStrategy<AppData>(AppData::class) {
    override fun defaultData(): AppData {
        return AppData(
            service = ServiceOption(port = null),
            web = WebOption(autoWebAccess = false, permanent = false, password = null),
            db = DBOption(""),
            backup = BackupOption(path = null, lastUpdate = null, autoBackup = false),
            proxy = ProxyOption(socks5Proxy = null, httpProxy = null)
        )
    }

    override fun migrations(register: MigrationRegister<JsonNode>) {
        register.empty("0.1.0")
    }

}