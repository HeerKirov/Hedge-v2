package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.library.form.Limit
import com.heerkirov.hedge.server.library.form.Offset
import com.heerkirov.hedge.server.library.form.Order
import com.heerkirov.hedge.server.library.form.Search
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.types.Opt
import com.heerkirov.hedge.server.utils.types.OrderItem
import java.time.LocalDate
import java.time.LocalDateTime

data class IllustRes(val id: Int, val type: Illust.IllustType, val childrenCount: Int?,
                     val file: String, val thumbnailFile: String,
                     val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                     val orderTime: LocalDateTime)

data class IllustSimpleRes(val id: Int, val thumbnailFile: String)

data class IllustDetailRes(val id: Int, val fileId: Int, val file: String, val thumbnailFile: String,
                           val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>,
                           val description: String, val score: Int?, val favorite: Boolean, val tagme: Illust.Tagme,
                           val originDescription: String, val originScore: Int?,
                           val partitionTime: LocalDate, val orderTime: LocalDateTime,
                           val createTime: LocalDateTime, val updateTime: LocalDateTime)

data class IllustCollectionRelatedRes(val associate: AssociateRes?)

data class IllustImageRelatedRes(val collection: IllustParent?,
                                 val albums: List<AlbumSimpleRes>,
                                 val folders: List<FolderSimpleRes>,
                                 val associate: AssociateRes?)

data class IllustParent(val id: Int, val thumbnailFile: String, val childrenCount: Int)

data class AssociateRes(val id: Int, val totalCount: Int, val items: List<IllustRes>)

data class IllustImageOriginRes(val source: String?, val sourceTitle: String?, val sourceId: Long?, val sourcePart: Int?,
                                val title: String?, val description: String?,
                                val tags: List<SourceTagDto>?,
                                val pools: List<String>?, val children: List<Int>?, val parents: List<Int>?)

data class IllustImageFileInfoRes(val file: String, val extension: String, val size: Long, val thumbnailSize: Long?, val resolutionWidth: Int, val resolutionHeight: Int, val createTime: LocalDateTime)

data class IllustQueryFilter(@Limit val limit: Int,
                             @Offset val offset: Int,
                             @Search val query: String?,
                             @Order(options = ["id", "score", "orderTime", "createTime", "updateTime"])
                             val order: List<OrderItem>? = null,
                             val topic: Int? = null,
                             val author: Int? = null,
                             val type: Illust.IllustType,
                             val partition: LocalDate? = null,
                             val favorite: Boolean? = null)

data class IllustCollectionCreateForm(val images: List<Int>,
                                      val description: String? = null,
                                      val score: Int? = null,
                                      val favorite: Boolean = false,
                                      val tagme: Illust.Tagme = Illust.Tagme.EMPTY)

open class IllustCollectionUpdateForm(val topics: Opt<List<Int>>, val authors: Opt<List<Int>>, val tags: Opt<List<Int>>,
                                      val description: Opt<String?>, val score: Opt<Int?>, val favorite: Opt<Boolean>, val tagme: Opt<Illust.Tagme>)

class IllustCollectionRelatedUpdateForm(val associateId: Opt<Int?>)

class IllustImageUpdateForm(topics: Opt<List<Int>>, authors: Opt<List<Int>>, tags: Opt<List<Int>>,
                            description: Opt<String?>, score: Opt<Int?>, favorite: Opt<Boolean>, tagme: Opt<Illust.Tagme>,
                            val partitionTime: Opt<LocalDate>, val orderTime: Opt<LocalDateTime>) : IllustCollectionUpdateForm(topics, authors, tags, description, score, favorite, tagme)

class IllustImageRelatedUpdateForm(val associateId: Opt<Int?>, val collectionId: Opt<Int?>)

class IllustImageOriginUpdateForm(val source: Opt<String?>, val sourceId: Opt<Long?>, val sourcePart: Opt<Int?>,
                                  val title: Opt<String?>, val description: Opt<String?>, val tags: Opt<List<SourceTagDto>>,
                                  val pools: Opt<List<String>>, val children: Opt<List<Int>>, val parents: Opt<List<Int>>)

class ImagePropsCloneForm(val props: Props, val merge: Boolean = false, val deleteFrom: Boolean = false, val from: Int, val to: Int) {
    data class Props(
        val score: Boolean = false,
        val favorite: Boolean = false,
        val description: Boolean = false,
        val tagme: Boolean = false,
        val metaTags: Boolean = false,
        val partitionTime: Boolean = false,
        val orderTime: Boolean = false,
        val collection: Boolean = false,
        val albums: Boolean = false,
        val folders: Boolean = false,
        val associate: Boolean = false,
        val source: Boolean = false
    )
}