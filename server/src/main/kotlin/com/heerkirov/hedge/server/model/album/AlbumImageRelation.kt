package com.heerkirov.hedge.server.model.album

/**
 * 画集中的image的关系。
 */
data class AlbumImageRelation(val albumId: Int,
                              /**
                               * 此关联项的类型。
                               */
                              val type: Type,
                              /**
                               * 关联的image id。没有写0。
                               */
                              val imageId: Int,
                              /**
                               * subtitle的内容。
                               */
                              val subtitle: String?,
                              /**
                               * * 此image在此画集中的排序顺位，从0开始，由系统统一调配，0号视作封面
                               * */
                              val ordinal: Int) {
    enum class Type { IMAGE, SUBTITLE }
}