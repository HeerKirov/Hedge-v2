package com.heerkirov.hedge.server.model

import com.heerkirov.hedge.server.utils.BinaryComposition

/**
 * 注解。
 * 注解系统相当于是“给标签的标签”，直接关联到tag、topic或author。
 * 不能直接关联到illust等，因为它不是标签。不过，标记为导出的注解会以导出的形式关联到illust，此时可以使用注解查询语法。
 * 非导出注解不会导出给images，因此只能用于标签查询。在image查询中也可用，但因为会严重拖慢性能而受到限制。
 */
data class Annotation(val id: Int?,
                      /**
                       * 注解名称。
                       */
                      val name: String,
                      /**
                       * 可导出至image的注解。
                       */
                      val canBeExported: Boolean,
                      /**
                       * 此注解的适用范围。
                       * 限定此注解只能适用于什么类型的标签。可以分到tag/author/topic大类，或细分到更细的子类。
                       */
                      val availableFor: AnnotationTarget?) {

    enum class AnnotationTarget(override val binary: Int) : BinaryComposition.CompositionOperator {
        TAG(0b1),
        ARTIST(0b10),
        STUDIO(0b100),
        PUBLISH(0b1000),
        COPYRIGHT(0b10000),
        WORK(0b100000),
        CHARACTER(0b1000000),
        AUTHOR(ARTIST.binary + STUDIO.binary + PUBLISH.binary),
        TOPIC(COPYRIGHT.binary + WORK.binary + CHARACTER.binary)
    }

    enum class ExportedFrom(override val binary: Int): BinaryComposition.CompositionOperator {
        TAG(0b1),
        AUTHOR(0b10),
        TOPIC(0b100)
    }

    /**
     * 注解与tag的关联。
     */
    data class TagRelation(val annotationId: Int, val tagId: Int)
    /**
     * 注解与topic的关联。
     */
    data class TopicRelation(val annotationId: Int, val topicId: Int)
    /**
     * 注解与author的关联。
     */
    data class AuthorRelation(val annotationId: Int, val authorId: Int)
    /**
     * 可导出的注解与illust的关联。
     */
    data class IllustRelation(val annotationId: Int, val illustId: Int, /** 标记此注解从哪类标签导出来的。*/val exportedFrom: ExportedFrom)
    /**
     * 可导出的注解与album的关联。
     */
    data class AlbumRelation(val annotationId: Int, val albumId: Int, /** 标记此注解从哪类标签导出来的。*/val exportedFrom: ExportedFrom)
}