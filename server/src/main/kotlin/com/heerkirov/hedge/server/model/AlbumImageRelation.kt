package com.heerkirov.hedge.server.model

/**
 * 画集中的image的关系。
 */
data class AlbumImageRelation(val albumId: Int,
                              val imageId: Int,
                              /**
                               * * 此image在此画集中的排序顺位，从0开始，由系统统一调配，0号视作封面
                               * */
                              val ordinal: Int)