package com.heerkirov.hedge.server.components.service

import com.fasterxml.jackson.core.type.TypeReference
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.manager.SourceManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.dao.source.SourceTagRelations
import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.utils.business.takeThumbnailFilepath
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.firstOrNull
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.parseJSONObject
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import java.io.File

class SourceImageService(private val data: DataRepository, private val sourceManager: SourceManager, private val queryManager: QueryManager) {
    private val orderTranslator = OrderTranslator {
        "ordinal" to SourceImages.id
        "source_id" to SourceImages.sourceId
        "source" to SourceImages.source
    }

    fun list(filter: SourceImageQueryFilter): ListResult<SourceImageRes> {
        val schema = if(filter.query.isNullOrBlank()) null else {
            queryManager.querySchema(filter.query, QueryManager.Dialect.SOURCE_IMAGE).executePlan ?: return ListResult(0, emptyList())
        }
        val titles = data.metadata.source.sites.associate { it.name to it.title }
        return data.db.from(SourceImages)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .let { if(filter.sourceTag == null) it else {
                it.innerJoin(SourceTagRelations, SourceTagRelations.sourceId eq SourceImages.id)
                    .innerJoin(SourceTags, (SourceTags.id eq SourceTagRelations.tagId) and (SourceTags.name eq filter.sourceTag))
            } }
            .let { if(filter.imageId == null) it else it.innerJoin(Illusts, (Illusts.sourceImageId eq SourceImages.id) and (Illusts.id eq filter.imageId)) }
            .select(SourceImages.source, SourceImages.sourceId)
            .whereWithConditions {
                if(filter.source != null) {
                    it += SourceImages.source eq filter.source
                }
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(SourceImages.id) }
            .limit(filter.offset, filter.limit)
            .orderBy(orderTranslator, filter.order, schema?.orderConditions, default = descendingOrderItem("ordinal"))
            .toListResult {
                val source = it[SourceImages.source]!!
                val sourceId = it[SourceImages.sourceId]!!
                SourceImageRes(source, titles.getOrDefault(source, source), sourceId)
            }
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws AlreadyExists 此对象已存在
     */
    fun create(form: SourceImageCreateForm) {
        data.db.transaction {
            sourceManager.checkSource(form.source, form.sourceId)
            sourceManager.createOrUpdateSourceImage(form.source, form.sourceId,
                title = form.title, description = form.description, tags = form.tags,
                pools = form.pools, children = form.children, parents = form.parents,
                allowUpdate = false)
        }
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    fun createBulk(forms: List<SourceImageCreateForm>) {
        data.db.transaction {
            forms.forEach { form -> sourceManager.checkSource(form.source, form.sourceId) }
            forms.forEach { form ->
                sourceManager.createOrUpdateSourceImage(form.source, form.sourceId,
                    title = form.title, description = form.description, tags = form.tags,
                    pools = form.pools, children = form.children, parents = form.parents)
            }
        }
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws IllegalFileExtensionError 此扩展名不受支持
     */
    fun upload(form: SourceUploadForm) {
        createByContent(form.content.reader().readText(), form.extension)
    }

    /**
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     * @throws FileNotFoundError 此文件不存在
     * @throws IllegalFileExtensionError 此扩展名不受支持
     */
    fun import(form: SourceImportForm) {
        val file = File(form.filepath)
        if(!file.exists() || !file.canRead()) throw be(FileNotFoundError())
        val content = file.readText()
        val extension = file.extension
        createByContent(content, extension)
    }

    /**
     * 使用file content执行创建。
     * @throws ResourceNotExist ("source", string) 给出的source不存在
     */
    private fun createByContent(content: String, type: String) {
        when (type) {
            "json" -> {
                val forms = try {
                    content.parseJSONObject(object : TypeReference<List<SourceUploadModel>>() {})
                }catch (e: Exception) {
                    throw be(ContentParseError(e.message ?: ""))
                }
                createBulk(forms.map {
                    SourceImageCreateForm(it.source, it.sourceId,
                        if(it.title.isNullOrBlank()) undefined() else optOf(it.title.trim()),
                        if(it.description.isNullOrBlank()) undefined() else optOf(it.description.trim()),
                        if(it.tags.isNullOrEmpty()) undefined() else optOf(it.tags),
                        if(it.pools.isNullOrEmpty()) undefined() else optOf(it.pools),
                        if(it.children.isNullOrEmpty()) undefined() else optOf(it.children),
                        if(it.parents.isNullOrEmpty()) undefined() else optOf(it.parents)
                    )
                })
            }
            "txt" -> {
                val rows = content.split('\n').filter { it.isNotBlank() }.map { it.split(',').map(String::trim) }
                val forms = try {
                    rows.map { row ->
                        SourceImageCreateForm(
                            row[0],
                            row[1].toLong(),
                            row.getOrNull(2).let { if(it.isNullOrEmpty()) undefined() else optOf(it) },
                            row.getOrNull(3).let { if(it.isNullOrEmpty()) undefined() else optOf(it) },
                            undefined(),
                            undefined(),
                            undefined(),
                            undefined()
                        )
                    }
                }catch (e: Exception) {
                    throw be(ContentParseError(e.message ?: ""))
                }
                createBulk(forms)
            }
            else -> throw be(IllegalFileExtensionError(type))
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(source: String, sourceId: Long): SourceImageDetailRes {
        val row = data.db.from(SourceImages).select()
            .where { (SourceImages.source eq source) and (SourceImages.sourceId eq sourceId) }
            .firstOrNull()
            ?: throw be(NotFound())

        val sourceRowId = row[SourceImages.id]!!
        val relation = row[SourceImages.relations]
        val sourceTags = data.db.from(SourceTags)
            .innerJoin(SourceTagRelations, (SourceTags.id eq SourceTagRelations.tagId) and (SourceTagRelations.sourceId eq sourceRowId))
            .select()
            .map { SourceTags.createEntity(it) }
            .map { SourceTagDto(it.name, it.displayName, it.type) }
        val sourceTitle = data.metadata.source.sites.find { it.name == source }?.title

        return SourceImageDetailRes(source, sourceTitle ?: source, sourceId,
            row[SourceImages.title] ?: "",
            row[SourceImages.description] ?: "",
            sourceTags,
            relation?.pools ?: emptyList(),
            relation?.children ?: emptyList(),
            relation?.parents ?: emptyList())
    }

    fun getRelatedImages(source: String, sourceId: Long): List<IllustSimpleRes> {
        return data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { (Illusts.sourceId eq sourceId) and (Illusts.source eq source) }
            .orderBy(Illusts.id.asc())
            .map { row ->
                val id = row[Illusts.id]!!
                val thumbnailFile = takeThumbnailFilepath(row)
                IllustSimpleRes(id, thumbnailFile)
            }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun update(source: String, sourceId: Long, form: SourceImageUpdateForm) {
        sourceManager.checkSource(source, sourceId)
        sourceManager.createOrUpdateSourceImage(source, sourceId,
            title = form.title, description = form.description, tags = form.tags,
            pools = form.pools, children = form.children, parents = form.parents,
            allowCreate = false)
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(source: String, sourceId: Long) {
        data.db.transaction {
            val row = data.db.from(SourceImages).select()
                .where { (SourceImages.source eq source) and (SourceImages.sourceId eq sourceId) }
                .firstOrNull()
                ?: throw be(NotFound())

            val sourceRowId = row[SourceImages.id]!!
            data.db.update(Illusts) {
                where { it.sourceImageId eq sourceRowId }
                set(it.sourceImageId, null)
                set(it.source, null)
                set(it.sourceId, null)
                set(it.sourcePart, null)
            }

            data.db.delete(SourceImages) { it.id eq sourceRowId }
        }
    }
}