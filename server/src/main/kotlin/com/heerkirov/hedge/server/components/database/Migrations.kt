package com.heerkirov.hedge.server.components.database

import com.fasterxml.jackson.databind.JsonNode
import com.heerkirov.hedge.server.utils.Resources
import com.heerkirov.hedge.server.utils.SqlDelimiter
import com.heerkirov.hedge.server.utils.migrations.*
import org.ktorm.database.Database

object MetadataMigrationStrategy : JsonObjectStrategy<Metadata>(Metadata::class) {
    override fun defaultData(): Metadata {
        return Metadata(
            meta = MetaOption(
                scoreDescriptions = emptyList(),
                autoCleanTagme = true,
                topicColors = emptyMap(),
                authorColors = emptyMap()
            ),
            query = QueryOption(
                chineseSymbolReflect = false,
                translateUnderscoreToSpace = false,
                queryLimitOfQueryItems = 20,
                warningLimitOfUnionItems = 20,
                warningLimitOfIntersectItems = 8
            ),
            source = SourceOption(
                sites = mutableListOf()
            ),
            import = ImportOption(
                autoAnalyseMeta = false,
                setTagmeOfTag = true,
                setTagmeOfSource = true,
                setTimeBy = ImportOption.TimeType.UPDATE_TIME,
                setPartitionTimeDelay = null,
                sourceAnalyseRules = emptyList(),
                systemDownloadHistoryPath = null
            ),
            spider = SpiderOption(
                rules = mutableMapOf(),
                publicRule = SpiderOption.SpiderRule(
                    useProxy = false,
                    disableProxyAfterTimes = null,
                    timeout = 15000,
                    retryCount = 3,
                    tryInterval = 8000
                ),
                siteRules = emptyMap()
            )
        )
    }

    override fun migrations(register: MigrationRegister<JsonNode>) {
        register.empty("0.1.0")
    }

}

object StorageMigrationStrategy : JsonObjectStrategy<Storage>(Storage::class) {
    override fun defaultData(): Storage {
        return Storage(
            tagExporter = TagExporter(
                refreshGlobalOrdinal = false
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
                Resources.getResourceAsText("migrations/v$version.sql")
                    .let { SqlDelimiter.splitByDelimiter(it) }
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