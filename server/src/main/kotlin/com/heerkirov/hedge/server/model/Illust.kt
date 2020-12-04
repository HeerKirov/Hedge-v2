package com.heerkirov.hedge.server.model

import com.heerkirov.hedge.server.utils.Composition
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * 图片/集合(image/collection)的混合表。
 * 混合表有助于减少拆分表时的illust和tag relation冗余，并且还能保持在两个层级上的查询效率。
 *
 * 导出信息是为了区分从关联对象计算而来的属性以及手写的属性而做的冗余，并且会用于查询。
 *  - 编写图像的信息而没写集合的信息时，集合会采用某种算法聚合图像的此信息导出；
 *  - 编写集合的信息而没写某张图像的信息时，此信息会复制导出至图像；
 *  - 为了在相同的字段内查询，导出信息也会复制一份手写属性。
 */
data class Illust(val id: Int,
                  /**
                   * 对象类型。区分image和collection。
                   */
                  val type: Type,
                  /**
                   * [only image]所属父集合的id。
                   */
                  val parentId: Int?,
                  /**
                   * 关联的file record的id。
                   */
                  val fileId: Int,
                  /**
                   * 链接的来源网站。
                   */
                  val source: String? = null,
                  /**
                   * 链接的来源网站的图像id。
                   */
                  val sourceId: Long? = null,
                  /**
                   * 链接的来源网站的二级图像id。有些会有，比如pixiv。来源网站没有这个信息时，写0。
                   */
                  val sourcePart: Int? = null,
                  /**
                   * 简述信息。
                   */
                  val description: String = "",
                  /**
                   * 评分。
                   */
                  val score: Int? = null,
                  /**
                   * 喜爱标记。
                   */
                  val favorite: Boolean = false,
                  /**
                   * 一项todo标记，标出illust还有哪些元信息需要写。
                   */
                  val tagme: Tagme,
                  /**
                   * relation(裙带关系)允许collection或image与其他项建立某种更松散的联系。
                   * 这种关系允许任意两个illust对象建立，即使illust和collection之间也可以。
                   * 裙带关系的传播是有限可控的，只会一对一建立，或者与关联对象的一级间接对象建立。类似AB系统中的无限间接传播杀伤力较大不可控，在这里不考虑使用。
                   * 裙带关系一般用于联系collection，通常是相近内容不同版本的collection们。有时也用于联系相近内容不同版本/凑成col不方便的image。
                   */
                  val relations: List<Int>? = null,
                  /**
                   * [exported field]导出的简述信息。聚合时采用。
                   */
                  val exportedDescription: String = "",
                  /**
                   * [exported field]导出的评分，聚合时取平均值。
                   */
                  val exportedScore: Int? = null,
                  /**
                   * [for image]用于日历分组的时间。
                   * [for collection][exported field]集合的值是导出值，取最早项。
                   */
                  val partitionTime: LocalDate,
                  /**
                   * [for image]用于排序的时间。
                   * [for collection][exported field]集合的值是导出值，取最早时间。
                   */
                  val orderTime: Long,
                  /**
                   * 真实的记录创建时间。
                   */
                  val createTime: LocalDateTime,
                  /**
                   * [for image]对图像进行替换更新的时间。
                   * [for collection]集合的内容发生变化的时间。
                   */
                  val updateTime: LocalDateTime) {

    enum class Type {
        /**
         * image类型的illust，且不属于集合。
         */
        IMAGE,
        /**
         * image类型的illust，且属于集合。
         */
        IMAGE_WITH_PARENT,
        /**
         * collection类型的illust。
         */
        COLLECTION
    }

    open class Tagme(value: Int) : Composition<Tagme>(Tagme::class, value) {
        /**
         * 标签。
         */
        object TAG : Tagme(0b1)
        /**
         * 作者标签。
         */
        object AUTHOR : Tagme(0b10)
        /**
         * 主题标签。
         */
        object TOPIC : Tagme(0b100)
        /**
         * 任意关联关系。
         */
        object RELATION : Tagme(0b1000)
        /**
         * 其他元数据。
         */
        object OTHER : Tagme(0b10000)

        object EMPTY :Tagme(0b0)

        companion object {
            val baseElements = listOf(TAG, AUTHOR, TOPIC, RELATION, OTHER)
            val empty = EMPTY
        }
    }
}