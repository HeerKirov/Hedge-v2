package com.heerkirov.hedge.server.components.database

import com.heerkirov.hedge.server.definitions.Filename
import com.heerkirov.hedge.server.utils.Fs
import com.heerkirov.hedge.server.utils.ktorm.HedgeDialect
import com.heerkirov.hedge.server.utils.migrations.VersionFileMigrator
import com.heerkirov.hedge.server.utils.toJSONString
import org.ktorm.database.Database
import java.io.Closeable
import java.sql.Connection
import java.sql.DriverManager

class DBInstance(val dbPath: String) : Closeable {
    private val metadataFilePath = "$dbPath/${Filename.META_DAT}"
    private val storageFilePath = "$dbPath/${Filename.STORAGE_DAT}"

    val database: Database
    val metadata: Metadata

    private val conn: Connection

    init {
        Fs.mkdir(dbPath)

        conn = DriverManager.getConnection("jdbc:sqlite:$dbPath/${Filename.DATA_SQLITE}")
        conn.attach("$dbPath/${Filename.META_SQLITE}", "meta_db")
        conn.attach("$dbPath/${Filename.ORIGIN_SQLITE}", "origin_db")
        conn.attach("$dbPath/${Filename.SOURCE_SQLITE}", "source_db")
        conn.attach("$dbPath/${Filename.SYSTEM_SQLITE}", "system_db")

        database = Database.connect(dialect = HedgeDialect()) {
            object : Connection by conn {
                override fun close() { /* do nothing */ }
            }
        }

        VersionFileMigrator("$dbPath/${Filename.VERSION_LOCK}").use {
            it.migrate(database, DatabaseMigrationStrategy)
            it.migrate(Fs.readText(metadataFilePath), MetadataMigrationStrategy).let { (d, changed) ->
                if(changed) { Fs.writeText(metadataFilePath, d.toJSONString()) }
                metadata = d
            }
        }
    }

    fun saveData() {
        Fs.writeFile(metadataFilePath, metadata)
    }

    override fun close() {
        conn.close()
    }

    private fun Connection.attach(path: String, name: String) {
        prepareStatement("attach database ? as ?").use { stat ->
            stat.setString(1, path)
            stat.setString(2, name)
            stat.execute()
        }
    }
}