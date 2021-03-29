package com.heerkirov.hedge.server.dao.collection

import com.heerkirov.hedge.server.model.collection.FolderImageRelation
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.int

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
