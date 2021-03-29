package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.AlbumExporterTask
import com.heerkirov.hedge.server.components.backend.IllustExporterTask
import com.heerkirov.hedge.server.components.backend.IllustMetaExporter
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.components.kit.AuthorKit
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumAuthorRelations
import com.heerkirov.hedge.server.dao.illust.IllustAuthorRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.AuthorAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.utils.DateTime
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.runIf
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class AuthorService(private val data: DataRepository,
                    private val kit: AuthorKit,
                    private val queryManager: QueryManager,
                    private val illustMetaExporter: IllustMetaExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Authors.id
        "name" to Authors.name
        "score" to Authors.exportedScore nulls last
        "count" to Authors.cachedCount nulls last
        "createTime" to Authors.createTime
        "updateTime" to Authors.updateTime
    }

    fun list(filter: AuthorFilter): ListResult<AuthorRes> {
        val schema = if(filter.query.isNullOrBlank()) null else {
            queryManager.querySchema(filter.query, QueryManager.Dialect.AUTHOR).executePlan ?: return ListResult(0, emptyList())
        }
        return data.db.from(Authors)
            .let { schema?.joinConditions?.fold(it) { acc, join -> if(join.left) acc.leftJoin(join.table, join.condition) else acc.innerJoin(join.table, join.condition) } ?: it }
            .select()
            .whereWithConditions {
                if(filter.favorite != null) { it += Authors.favorite eq filter.favorite }
                if(filter.type != null) { it += Authors.type eq filter.type }
                if(schema != null && schema.whereConditions.isNotEmpty()) {
                    it.addAll(schema.whereConditions)
                }
            }
            .runIf(schema?.distinct == true) { groupBy(Authors.id) }
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("id"))
            .limit(filter.offset, filter.limit)
            .toListResult { newAuthorRes(Authors.createEntity(it)) }
    }

    fun create(form: AuthorCreateForm): Int {
        data.db.transaction {
            val name = kit.validateName(form.name)
            val otherNames = kit.validateOtherNames(form.otherNames)
            val keywords = kit.validateKeywords(form.keywords)

            val annotations = kit.validateAnnotations(form.annotations, form.type)
            val createTime = DateTime.now()

            val id = data.db.insertAndGenerateKey(Authors) {
                set(it.name, name)
                set(it.otherNames, otherNames)
                set(it.keywords, keywords)
                set(it.description, form.description)
                set(it.type, form.type)
                set(it.links, form.links)
                set(it.favorite, form.favorite)
                set(it.score, form.score)
                set(it.exportedScore, form.score ?: 0)
                set(it.cachedCount, 0)
                set(it.cachedAnnotations, annotations)
                set(it.createTime, createTime)
                set(it.updateTime, createTime)
            } as Int

            kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet(), creating = true)

            return id
        }
    }

    fun get(id: Int): AuthorDetailRes {
        return data.db.sequenceOf(Authors).firstOrNull { it.id eq id }
            ?.let { newAuthorDetailRes(it) }
            ?: throw NotFound()
    }

    fun update(id: Int, form: AuthorUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Authors).firstOrNull { it.id eq id } ?: throw NotFound()

            val newName = form.name.letOpt { kit.validateName(it, id) }
            val newOtherNames = form.otherNames.letOpt { kit.validateOtherNames(it) }
            val newKeywords = form.keywords.letOpt { kit.validateKeywords(it) }

            val newAnnotations = form.annotations.letOpt { kit.validateAnnotations(it, form.type.unwrapOr { record.type }) }

            val newExportedScore = form.score.letOpt {
                it ?: data.db.from(Illusts)
                    .innerJoin(IllustAuthorRelations, Illusts.id eq IllustAuthorRelations.illustId)
                    .select(count(Illusts.exportedScore).aliased("count"))
                    .where { (IllustAuthorRelations.authorId eq id) and (Illusts.type eq Illust.Type.IMAGE) or (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
                    .first().getInt("count")
            }

            if(anyOpt(newName, newOtherNames, newKeywords, form.type, form.description, form.links, form.favorite, form.score, newExportedScore, newAnnotations)) {
                data.db.update(Authors) {
                    where { it.id eq id }
                    newName.applyOpt { set(it.name, this) }
                    newOtherNames.applyOpt { set(it.otherNames, this) }
                    newKeywords.applyOpt { set(it.keywords, this) }
                    form.type.applyOpt { set(it.type, this) }
                    form.description.applyOpt { set(it.description, this) }
                    form.links.applyOpt { set(it.links, this) }
                    form.favorite.applyOpt { set(it.favorite, this) }
                    form.score.applyOpt { set(it.score, this) }
                    newExportedScore.applyOpt { set(it.exportedScore, this) }
                    newAnnotations.applyOpt { set(it.cachedAnnotations, this) }
                }
            }

            newAnnotations.letOpt { annotations -> kit.processAnnotations(id, annotations.asSequence().map { it.id }.toSet()) }

            if(newAnnotations.isPresent) {
                //发生关系类变化时，将关联的illust/album重导出
                data.db.from(IllustAuthorRelations)
                    .select(IllustAuthorRelations.illustId)
                    .where { IllustAuthorRelations.authorId eq id }
                    .map { IllustExporterTask(it[IllustAuthorRelations.illustId]!!, exportMeta = true, exportDescription = false, exportFileAndTime = false, exportScore = false) }
                    .let { illustMetaExporter.appendNewTask(it) }
                data.db.from(AlbumAuthorRelations)
                    .select(AlbumAuthorRelations.albumId)
                    .where { AlbumAuthorRelations.authorId eq id }
                    .map { AlbumExporterTask(it[AlbumAuthorRelations.albumId]!!, exportMeta = true) }
                    .let { illustMetaExporter.appendNewTask(it) }

                queryManager.flushCacheOf(QueryManager.CacheType.AUTHOR)
            }
        }
    }

    fun delete(id: Int) {
        data.db.transaction {
            data.db.delete(Authors) { it.id eq id }.let {
                if(it <= 0) throw NotFound()
            }
            data.db.delete(IllustAuthorRelations) { it.authorId eq id }
            data.db.delete(AlbumAuthorRelations) { it.authorId eq id }
            data.db.delete(AuthorAnnotationRelations) { it.authorId eq id }

            queryManager.flushCacheOf(QueryManager.CacheType.AUTHOR)
        }
    }
}