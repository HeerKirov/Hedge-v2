package com.heerkirov.hedge.server.dao.illust

import com.heerkirov.hedge.server.model.illust.FileRecord
import com.heerkirov.hedge.server.utils.ktorm.enum
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object FileRecords : BaseTable<FileRecord>("file", schema = "origin_db") {
    val id = int("id").primaryKey()
    val folder = varchar("folder")
    val extension = varchar("extension")
    val size = long("size")
    val thumbnailSize = long("thumbnail_size")
    val resolutionWidth = int("resolution_width")
    val resolutionHeight = int("resolution_height")
    val status = enum("status", typeRef<FileRecord.FileStatus>())
    val deleted = boolean("deleted")
    val createTime = datetime("create_time")
    val updateTime = datetime("update_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = FileRecord(
        id = row[id]!!,
        folder = row[folder]!!,
        extension = row[extension]!!,
        size = row[size]!!,
        thumbnailSize = row[thumbnailSize]!!,
        status = row[status]!!,
        resolutionWidth = row[resolutionWidth]!!,
        resolutionHeight = row[resolutionHeight]!!,
        deleted = row[deleted]!!,
        createTime = row[createTime]!!,
        updateTime = row[updateTime]!!
    )
}