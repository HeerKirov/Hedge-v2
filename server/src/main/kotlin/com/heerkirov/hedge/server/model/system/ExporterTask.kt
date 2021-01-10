package com.heerkirov.hedge.server.model.system

import java.time.LocalDateTime

/**
 * 系统导出任务的持久化记录项。
 */
data class ExporterTask(val id: Int,
                        /**
                         * 目标实体类型。
                         */
                        val entityType: EntityType,
                        /**
                         * 目标实体ID。
                         */
                        val entityId: Int,
                        /**
                         * 导出fileId和时间属性。
                         */
                        val exportFileAndTime: Boolean,
                        /**
                         * 导出描述。
                         */
                        val exportDescription: Boolean,
                        /**
                         * 导出评分。
                         */
                        val exportScore: Boolean,
                        /**
                         * 导出meta tag。
                         */
                        val exportMeta: Boolean,
                        /**
                         * 此任务创建的时间。
                         */
                        val createTime: LocalDateTime) {
    enum class EntityType { ILLUST, ALBUM }
}