package com.heerkirov.hedge.server.utils.business

import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.model.source.FileRecord
import org.ktorm.dsl.QueryRowSet


/**
 * 导出文件路径。
 */
fun getFilepath(folder: String, fileId: Int, extension: String): String {
    return "$folder/$fileId.$extension"
}

/**
 * 导出缩略图的路径。
 */
fun getThumbnailFilepath(folder: String, fileId: Int): String {
    return "$folder/$fileId.thumbnail.jpg"
}

/**
 * 直接从QueryRowSet中提取参数并生成file。使用前确保FileRecord的id/folder/extension都在。
 */
fun takeFilepath(it: QueryRowSet): String {
    val fileId = it[FileRecords.id]!!
    val folder = it[FileRecords.folder]!!
    val extension = it[FileRecords.extension]!!
    return getFilepath(folder, fileId, extension)
}

/**
 * 直接从QueryRowSet中提取参数并生成thumbnail file。使用前确保FileRecord的id/folder/extension/thumbnail都在。
 */
fun takeThumbnailFilepath(it: QueryRowSet): String {
    val fileId = it[FileRecords.id]!!
    val folder = it[FileRecords.folder]!!
    val extension = it[FileRecords.extension]!!
    return when(it[FileRecords.status]!!) {
        FileRecord.FileStatus.READY -> getThumbnailFilepath(folder, fileId)
        FileRecord.FileStatus.READY_WITHOUT_THUMBNAIL -> getFilepath(folder, fileId, extension)
        FileRecord.FileStatus.NOT_READY -> throw NullPointerException("Thumbnail file path is null.")
    }
}

/**
 * 直接从QueryRowSet中提取参数并生成file和thumbnail file。使用前确保FileRecord的id/folder/extension/thumbnail都在。
 */
fun takeAllFilepath(it: QueryRowSet): Pair<String, String> {
    val (f, t) = takeAllFilepathOrNull(it)
    if(t == null) throw NullPointerException("Thumbnail file path is null.")
    return Pair(f, t)
}

/**
 * 直接从QueryRowSet中提取参数并生成file和thumbnail file。使用前确保FileRecord的id/folder/extension/thumbnail都在。
 * 它有可能返回null的thumbnail。
 */
fun takeAllFilepathOrNull(it: QueryRowSet): Pair<String, String?> {
    val fileId = it[FileRecords.id]!!
    val folder = it[FileRecords.folder]!!
    val extension = it[FileRecords.extension]!!
    val file = getFilepath(folder, fileId, extension)
    val thumbnailFile = when(it[FileRecords.status]!!) {
        FileRecord.FileStatus.READY -> getThumbnailFilepath(folder, fileId)
        FileRecord.FileStatus.READY_WITHOUT_THUMBNAIL -> file
        FileRecord.FileStatus.NOT_READY -> null
    }
    return Pair(file, thumbnailFile)
}