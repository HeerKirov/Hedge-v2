package com.heerkirov.hedge.server.dao.source

import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.ktorm.enum
import com.heerkirov.hedge.server.utils.ktorm.json
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.*

object SourceImages : BaseTable<SourceImage>("source_image", schema = "source_db") {
    val source = varchar("source")
    val sourceId = long("source_id")
    val sourcePart = int("source_part")
    val title = varchar("title")
    val description = varchar("description")
    val tags = json("tags", typeRef<List<SourceImage.SourceTag>>())
    val relations = json("relations", typeRef<SourceImage.SourceRelation>())
    val analyseStatus = enum("analyse_status", typeRef<SourceImage.AnalyseStatus>())
    val analyseTime = datetime("analyse_time")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = SourceImage(
        source = row[source]!!,
        sourceId = row[sourceId]!!,
        sourcePart = row[sourcePart]!!,
        title = row[title],
        description = row[description],
        tags = row[tags],
        relations = row[relations],
        analyseStatus = row[analyseStatus]!!,
        analyseTime = row[analyseTime]
    )
}