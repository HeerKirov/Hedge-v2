package com.heerkirov.hedge.server.dto

import java.time.LocalDateTime

data class CollectionSituationRes(val id: Int, val childrenCount: Int, val orderTime: LocalDateTime,
                                  val childrenExamples: List<IllustSimpleRes>,
                                  val belongs: List<Int>)

data class ImageSituationRes(val id: Int, val thumbnailFile: String, val orderTime: LocalDateTime, val belong: IllustParent?)

data class AlbumSituationRes(val id: Int, val thumbnailFile: String, val ordinal: Int?)

data class FolderSituationRes(val id: Int, val thumbnailFile: String, val ordinal: Int?)

data class IllustIdForm(val illustIds: List<Int>)

data class AlbumSituationForm(val illustIds: List<Int>, val albumId: Int, val onlyExists: Boolean = false)

data class FolderSituationForm(val illustIds: List<Int>, val folderId: Int, val onlyExists: Boolean = false)