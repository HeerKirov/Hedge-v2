package com.heerkirov.hedge.server.model.collection

/**
 * 文件夹中的image的关联关系。
 */
data class FolderImageRelation(val folderId: Int,
                               val imageId: Int,
                               /*** 此image在此文件夹中的排序顺位，从0开始，由系统统一调配*/
                               val ordinal: Int)