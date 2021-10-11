package com.heerkirov.hedge.server.library.compiler.semantic.dialect

import com.heerkirov.hedge.server.library.compiler.semantic.framework.*

object IllustDialect : QueryDialect<IllustDialect.IllustOrderItem> {
    override val order = orderListOf<IllustOrderItem> {
        item(IllustOrderItem.ID, "id")
        item(IllustOrderItem.SCORE, "score", "s")
        item(IllustOrderItem.ORDINAL, "ordinal", "ord")
        item(IllustOrderItem.PARTITION, "partition", "pt")
        item(IllustOrderItem.CREATE_TIME, "create-time", "create", "ct")
        item(IllustOrderItem.UPDATE_TIME, "update-time", "update", "ut")
        item(IllustOrderItem.SOURCE_ID, "^id", "source-id")
        item(IllustOrderItem.SOURCE_FROM, "^from", "source-from")
    }
    override val elements: Array<out ElementFieldDefinition> = arrayOf(MetaTagElementField, AnnotationElementField, SourceTagElementField(true))

    val favorite = flagField("favorite", "favorite", "f")
    val id = patternNumberField("id", "id")
    val score = numberField("score", "score")
    val partition = dateField("partition", "partition", "pt")
    val ordinal = dateField("ordinal", "ordinal", "ord")
    val createTime = dateField("create-time", "create", "create-time", "ct")
    val updateTime = dateField("update-time", "update", "update-time", "ut")
    val description = patternStringField("description", "description", "desc")
    val extension = stringField("extension", "extension", "ext")
    val filesize = sizeField("filesize", "filesize", "size")
    val sourceId = patternNumberField("source-id", "^id", "source-id")
    val sourceFrom = stringField("source-from", "^from", "source-from")
    val sourceDescription = patternStringField("source-description", "^description", "^desc", "source-description", "source-desc")
    val analyseStatus = enumField<AnalyseStatus>("analyse-status", "analyse-status", "analyse") {
        item(AnalyseStatus.NO, "no", "none")
        item(AnalyseStatus.ANALYZED, "analyzed", "yes", "done")
        item(AnalyseStatus.ERROR, "error", "err")
        item(AnalyseStatus.MANUAL, "manual")
        item(AnalyseStatus.NOT_FOUND, "not-found", "404")
    }
    val tagme = compositionField<Tagme>("tagme", "tagme") {
        for (value in Tagme.values()) {
            item(value, value.name)
        }
    }

    enum class IllustOrderItem {
        ID, SCORE, ORDINAL, PARTITION, CREATE_TIME, UPDATE_TIME, SOURCE_ID, SOURCE_FROM
    }
    enum class AnalyseStatus {
        NO, ANALYZED, ERROR, MANUAL, NOT_FOUND
    }
    enum class Tagme {
        TAG, AUTHOR, TOPIC, SOURCE
    }
}