package com.heerkirov.hedge.server.tools


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