package com.heerkirov.hedge.server.model.system

data class HistoryRecord(/**
                          * 根据类型隔离的序列ID。
                          */
                         val sequenceId: Long,
                         /**
                          * 存储类型。
                          */
                         val type: Type,
                         /**
                          * 目标标识。
                          */
                         val key: String,
                         /**
                          * 记录时间。
                          */
                         val recordTime: Long) {
    enum class Type {
        META_EDITOR_TAG,
        META_EDITOR_TOPIC,
        META_EDITOR_AUTHOR,
        USED_FOLDER,
        USED_TOPIC,
        USED_ANNOTATION,
    }
}
