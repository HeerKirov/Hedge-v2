package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.FileRecord
import com.heerkirov.hedge.server.utils.ktorm.json
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.*

object FileRecords : BaseTable<FileRecord>("file", schema = "origin_db") {
    val id = int("id").primaryKey()
    val folder = varchar("folder")
    val extension = varchar("extension")
    val thumbnail = boolean("thumbnail")
    val size = long("size")
    val thumbnailSize = long("thumbnail_size")
    val deleted = boolean("deleted")
    val syncRecords = json("sync_records", typeRef<List<FileRecord.SyncRecord>>())
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = FileRecord(
        id = row[id]!!,
        folder = row[folder]!!,
        extension = row[extension]!!,
        thumbnail = row[thumbnail]!!,
        size = row[size]!!,
        thumbnailSize = row[thumbnailSize]!!,
        deleted = row[deleted]!!,
        syncRecords = row[syncRecords]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}