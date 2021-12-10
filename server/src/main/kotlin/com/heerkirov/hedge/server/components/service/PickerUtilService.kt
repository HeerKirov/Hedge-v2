package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.HistoryRecordManager
import com.heerkirov.hedge.server.dao.collection.Folders
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.be
import com.heerkirov.hedge.server.model.collection.Folder
import com.heerkirov.hedge.server.model.system.HistoryRecord
import org.ktorm.dsl.*
import org.ktorm.entity.associate
import org.ktorm.entity.filter
import org.ktorm.entity.sequenceOf

class PickerUtilService(private val data: DataRepository, private val historyRecordManager: HistoryRecordManager) {
    private val limitCount = 20

    fun getRecentFolders(): List<FolderSimpleRes> {
        val folderIds = historyRecordManager.getRecent(HistoryRecord.Type.USED_FOLDER, limitCount).map { it.toInt() }
        val result = data.db.from(Folders).select(Folders.id, Folders.title, Folders.parentAddress, Folders.type)
            .where { Folders.id inList folderIds and (Folders.type notEq Folder.FolderType.NODE) }
            .associate {
                val id = it[Folders.id]!!
                id to FolderSimpleRes(id, (it[Folders.parentAddress] ?: emptyList()) + it[Folders.title]!!, it[Folders.type]!!)
            }
        return folderIds.mapNotNull(result::get)
    }

    fun getRecentTopics(): List<TopicSimpleRes> {
        val topicIds = historyRecordManager.getRecent(HistoryRecord.Type.USED_TOPIC, limitCount).map { it.toInt() }
        val topicColors = data.metadata.meta.topicColors
        val result = data.db.from(Topics)
            .select(Topics.id, Topics.name, Topics.type)
            .where { Topics.id inList topicIds }
            .associate {
                val id = it[Topics.id]!!
                val type = it[Topics.type]!!
                val color = topicColors[type]
                id to TopicSimpleRes(id, it[Topics.name]!!, type, false, color)
            }
        return topicIds.mapNotNull(result::get)
    }

    fun getRecentAnnotations(): List<AnnotationRes> {
        val annotationIds = historyRecordManager.getRecent(HistoryRecord.Type.USED_ANNOTATION, limitCount).map { it.toInt() }
        val result = data.db.sequenceOf(Annotations).filter { it.id inList annotationIds }.associate { it.id to newAnnotationRes(it) }
        return annotationIds.mapNotNull(result::get)
    }

    fun pushUsedHistory(form: HistoryPushForm) {
        when (form.type.lowercase()) {
            "folder" -> historyRecordManager.push(HistoryRecord.Type.USED_FOLDER, form.id.toString())
            "topic" -> historyRecordManager.push(HistoryRecord.Type.USED_TOPIC, form.id.toString())
            "annotation" -> historyRecordManager.push(HistoryRecord.Type.USED_ANNOTATION, form.id.toString())
            else -> be(ParamError("type"))
        }
    }
}