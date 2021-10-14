package com.heerkirov.hedge.server.model.source

import com.heerkirov.hedge.server.enums.MetaType

/**
 * 原始标签映射。
 * 记录由来源信息的tag到app tag的映射关系，符合映射表的tag会放入建议列表。
 */
data class SourceTagMapping(val id: Int,
                            /**
                             * 来源网站的代号。
                             */
                            val source: String,
                            /**
                             * 来源tag id。
                             */
                            val sourceTagId: Int,
                            /**
                             * 转换为什么类型的tag。
                             */
                            val targetMetaType: MetaType,
                            /**
                             * 目标tag的tag id。
                             */
                            val targetMetaId: Int)