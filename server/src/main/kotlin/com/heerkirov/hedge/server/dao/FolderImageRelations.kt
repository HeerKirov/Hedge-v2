package com.heerkirov.hedge.server.dao

import com.heerkirov.hedge.server.model.FolderImageRelation
import me.liuwj.ktorm.dsl.QueryRowSet
import me.liuwj.ktorm.schema.BaseTable
import me.liuwj.ktorm.schema.int

object FolderImageRelations : BaseTable<FolderImageRelation>("folder_image_relation") {
    val folderId = int("folder_id")
    val imageId = int("image_id")
    val ordinal = int("ordinal")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = FolderImageRelation(
        folderId = row[folderId]!!,
        imageId = row[imageId]!!,
        ordinal = row[ordinal]!!
    )
}
