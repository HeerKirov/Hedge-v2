package com.heerkirov.hedge.server.model.system

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import java.time.LocalDate
import java.time.LocalDateTime

data class FindSimilarTask(val id: Int,
                           /**
                            * 此task的查询范围。
                            */
                           val selector: TaskSelector,
                           /**
                            * 此task的查询选项。是可选的。
                            */
                           val config: TaskConfig?,
                           /**
                            * 创建此单位的时间。
                            */
                           val recordTime: LocalDateTime) {

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
    @JsonSubTypes(value = [
        JsonSubTypes.Type(value = TaskSelectorOfImage::class, name = "image"),
        JsonSubTypes.Type(value = TaskSelectorOfPartition::class, name = "partitionTime"),
        JsonSubTypes.Type(value = TaskSelectorOfTopic::class, name = "topic"),
        JsonSubTypes.Type(value = TaskSelectorOfAuthor::class, name = "author"),
        JsonSubTypes.Type(value = TaskSelectorOfSourceTag::class, name = "sourceTag"),
    ])
    sealed interface TaskSelector

    data class TaskSelectorOfImage(val imageIds: List<Int>) : TaskSelector

    data class TaskSelectorOfPartition(val partitionTime: LocalDate) : TaskSelector

    data class TaskSelectorOfTopic(val topicIds: List<Int>) : TaskSelector

    data class TaskSelectorOfAuthor(val authorIds: List<Int>) : TaskSelector

    data class TaskSelectorOfSourceTag(val source: String, val sourceTags: List<String>) : TaskSelector

    data class TaskConfig(val findBySourceKey: Boolean,
                          val findBySimilarity: Boolean,
                          val findBySourceRelation: Boolean,
                          val findBySourceMark: Boolean,
                          val findBySimilarityThreshold: Double? = null,
                          val findBySourceRelationBasis: List<RelationBasis>? = null,
                          val filterByPartition: Boolean,
                          val filterByTopic: Boolean,
                          val filterByAuthor: Boolean,
                          val filterBySourceTagType: List<SourceAndTagType>)

    data class SourceAndTagType(val source: String, val tagType: String)

    enum class RelationBasis {
        RELATION, POOL, PART
    }
}