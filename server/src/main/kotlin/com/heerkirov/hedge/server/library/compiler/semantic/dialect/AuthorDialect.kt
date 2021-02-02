package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.framework.*

object AuthorDialect : QueryDialect<AuthorDialect.AuthorOrderItem> {
    override val order = orderListOf<AuthorOrderItem> {
        item(AuthorOrderItem.SCORE, "score", "s")
        item(AuthorOrderItem.IMAGE_COUNT, "image-count", "count")
        item(AuthorOrderItem.CREATE_TIME, "create-time", "create", "ct")
        item(AuthorOrderItem.UPDATE_TIME, "update-time", "update", "ut")
    }
    //TODO element转name

    val favorite = flagField("favorite", "favorite", "f")
    val type = enumField<Type>("type", "type") {
        for (value in Type.values()) {
            item(value, value.name)
        }
    }
    val score = numberField("score", "score")
    val imageCount = numberField("image-count", "count", "image-count")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
    val description = patternStringField("description", "description", "desc")

    enum class AuthorOrderItem {
        SCORE, IMAGE_COUNT, CREATE_TIME, UPDATE_TIME
    }
    enum class Type {
        UNKNOWN, ARTIST, STUDIO, PUBLISH
    }
}