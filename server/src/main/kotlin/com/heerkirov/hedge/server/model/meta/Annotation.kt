package com.heerkirov.hedge.server.model.meta

import com.heerkirov.hedge.server.utils.Composition
import java.time.LocalDateTime

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
                      val target: AnnotationTarget,
                      /**
                       * 此注解创建的时间。
                       */
                      val createTime: LocalDateTime) {

    open class AnnotationTarget(value: Int) : Composition<AnnotationTarget>(AnnotationTarget::class, value) {
        object TAG : AnnotationTarget(AnnotationTargetValues.TAG)
        object ARTIST : AnnotationTarget(AnnotationTargetValues.ARTIST)
        object STUDIO : AnnotationTarget(AnnotationTargetValues.STUDIO)
        object PUBLISH : AnnotationTarget(AnnotationTargetValues.PUBLISH)
        object COPYRIGHT : AnnotationTarget(AnnotationTargetValues.COPYRIGHT)
        object WORK : AnnotationTarget(AnnotationTargetValues.WORK)
        object CHARACTER : AnnotationTarget(AnnotationTargetValues.CHARACTER)
        object AUTHOR : AnnotationTarget(AnnotationTargetValues.ARTIST or AnnotationTargetValues.STUDIO or AnnotationTargetValues.PUBLISH)
        object TOPIC : AnnotationTarget(AnnotationTargetValues.COPYRIGHT or AnnotationTargetValues.WORK or AnnotationTargetValues.CHARACTER)
        object EMPTY : AnnotationTarget(0b0)

        companion object {
            val baseElements by lazy { listOf(TAG, ARTIST, STUDIO, PUBLISH, COPYRIGHT, WORK, CHARACTER) }
            val exportedElements by lazy { listOf(AUTHOR, TOPIC) }
            val empty by lazy { EMPTY }
        }
    }

    private object AnnotationTargetValues {
        const val TAG = 0b1
        const val ARTIST = 0b10
        const val STUDIO = 0b100
        const val PUBLISH = 0b1000
        const val COPYRIGHT = 0b10000
        const val WORK = 0b100000
        const val CHARACTER = 0b1000000
    }

    open class ExportedFrom(value: Int): Composition<ExportedFrom>(ExportedFrom::class, value) {
        object TAG : ExportedFrom(0b1)
        object AUTHOR : ExportedFrom(0b10)
        object TOPIC : ExportedFrom(0b100)
        object EMPTY : ExportedFrom(0b0)

        companion object {
            val baseElements by lazy { listOf(TAG, AUTHOR, TOPIC) }
            val empty by lazy { EMPTY }
        }
    }
}