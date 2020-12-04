package com.heerkirov.hedge.server.model

import com.heerkirov.hedge.server.utils.Composition

/**
 * 注解。
 * 注解系统相当于是“给标签的标签”，直接关联到tag、topic或author。
 * 不能直接关联到illust等，因为它不是标签。不过，标记为导出的注解会以导出的形式关联到illust，此时可以使用注解查询语法。
 * 非导出注解不会导出给images，因此只能用于标签查询。在image查询中也可用，但因为会严重拖慢性能而受到限制。
 */
data class Annotation(val id: Int,
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
                      val target: AnnotationTarget) {

    open class AnnotationTarget(value: Int) : Composition<AnnotationTarget>(AnnotationTarget::class, value) {
        object TAG : AnnotationTarget(0b1)
        object ARTIST : AnnotationTarget(0b10)
        object STUDIO : AnnotationTarget(0b100)
        object PUBLISH : AnnotationTarget(0b1000)
        object COPYRIGHT : AnnotationTarget(0b10000)
        object WORK : AnnotationTarget(0b100000)
        object CHARACTER : AnnotationTarget(0b1000000)
        object AUTHOR : AnnotationTarget(ARTIST.value or STUDIO.value or PUBLISH.value)
        object TOPIC : AnnotationTarget(COPYRIGHT.value or WORK.value or CHARACTER.value)
        object EMPTY : AnnotationTarget(0b0)

        companion object {
            val baseElements = listOf(TAG, ARTIST, STUDIO, PUBLISH, COPYRIGHT, WORK, CHARACTER)
            val exportedElements = listOf(AUTHOR, TOPIC)
            val empty = EMPTY
        }
    }

    open class ExportedFrom(value: Int): Composition<ExportedFrom>(ExportedFrom::class, value) {
        object TAG : ExportedFrom(0b1)
        object AUTHOR : ExportedFrom(0b10)
        object TOPIC : ExportedFrom(0b100)
        object EMPTY : ExportedFrom(0b0)

        companion object {
            val baseElements = listOf(TAG, AUTHOR, TOPIC)
            val empty = EMPTY
        }
    }
}