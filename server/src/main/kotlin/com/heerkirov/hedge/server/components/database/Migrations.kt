package com.heerkirov.hedge.server.components.database

import com.fasterxml.jackson.databind.JsonNode
import com.heerkirov.hedge.server.utils.Resources
import com.heerkirov.hedge.server.utils.SQLUtil
import com.heerkirov.hedge.server.utils.migrations.*
import me.liuwj.ktorm.database.Database

object MetadataMigrationStrategy : JsonObjectStrategy<Metadata>(Metadata::class) {
    override fun defaultData(): Metadata {
        return Metadata(
            meta = MetaOption(
                scoreMaximum = 5,
                scoreDescriptions = emptyList()
            ),
            source = SourceOption(
                sites = mutableListOf()
            ),
            import = ImportOption(
                autoAnalyseMeta = false,
                setTagme = emptyList(),
                setTimeBy = ImportOption.TimeType.UPDATE_TIME,
                setPartitionTimeDelay = null,
                sourceAnalyseRules = emptyList(),
                systemDownloadHistoryPath = null
            ),
            spider = SpiderOption(
                rules = mutableMapOf(),
                publicRule = SpiderOption.SpiderRule(),
                siteRules = emptyMap()
            )
        )
    }

    override fun migrations(register: MigrationRegister<JsonNode>) {
        register.empty("0.1.0")
    }

}

object DatabaseMigrationStrategy : SimpleStrategy<Database>() {
    override fun migrations(register: MigrationRegister<Database>) {
        register.useSQL("0.1.0")
    }

    /**
     * 向database应用resources资源文件中的sql文件。
     */
    private fun Database.useSQLResource(version: Version): Database {
        useConnection { conn ->
            conn.createStatement().use { stat ->
                Resources.getResourceAsText("/migrations/v$version.sql")
                    .let { SQLUtil.splitByDelimiter(it) }
                    .forEach { stat.execute(it) }
            }
        }

        return this
    }

    /**
     * 直接向database应用一个以sql文件同步为全部内容的版本。
     */
    private fun MigrationRegister<Database>.useSQL(version: String): MigrationRegister<Database> {
        return this.map(version) { it.useSQLResource(versionOf(version)) }
    }

}