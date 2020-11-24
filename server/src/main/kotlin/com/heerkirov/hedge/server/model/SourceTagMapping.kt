package com.heerkirov.hedge.server.model

/**
 * 原始标签映射。
 * 记录由来源信息的tag到app tag的映射关系，符合映射表的tag会放入建议列表。
 */
data class SourceTagMapping(val id: Int?,
                            /**
                             * 来源网站的代号，可以为null表示对任意来源适用。
                             */
                            val source: String?,
                            /**
                             * 源tag的类型，可以为null表示不区分类型。
                             */
                            val sourceTagType: String?,
                            /**
                             * 源tag名称。
                             */
                            val sourceTag: String,
                            /**
                             * 转换为什么类型的tag。
                             */
                            val targetTagType: TargetTagType,
                            /**
                             * 目标tag的tag id。
                             */
                            val targetTagId: Int) {
    enum class TargetTagType {
        TAG, AUTHOR, TOPIC
    }
}