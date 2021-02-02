package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.framework.*

object AlbumDialect : QueryDialect<AlbumDialect.AlbumOrderItem> {
    override val order = orderListOf<AlbumOrderItem> {
        item(AlbumOrderItem.ID, "id")
        item(AlbumOrderItem.SCORE, "score", "s")
        item(AlbumOrderItem.IMAGE_COUNT, "image-count", "count")
        item(AlbumOrderItem.CREATE_TIME, "create-time", "create", "ct")
        item(AlbumOrderItem.UPDATE_TIME, "update-time", "update", "ut")
    }
    //TODO element转Tag/Annotation

    val favorite = flagField("favorite", "favorite", "f")
    val id = patternNumberField("id", "id")
    val score = numberField("score", "score")
    val imageCount = numberField("image-count", "count", "image-count")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
    val title = patternStringField("title", "title")
    val description = patternStringField("description", "description", "desc")

    enum class AlbumOrderItem {
        ID, SCORE, IMAGE_COUNT, CREATE_TIME, UPDATE_TIME
    }
}