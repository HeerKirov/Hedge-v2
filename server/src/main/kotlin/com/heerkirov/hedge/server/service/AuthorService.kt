package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.NotFound
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.manager.AuthorManager
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.first
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.ListResult
import com.heerkirov.hedge.server.utils.types.toListResult
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf

class AuthorService(private val data: DataRepository, private val authorMgr: AuthorManager) {
    private val orderTranslator = OrderTranslator {
        "id" to Authors.id
        "name" to Authors.name
        "score" to Authors.exportedScore nulls last
        "count" to Authors.cachedCount nulls last
    }

    fun list(filter: AuthorFilter): ListResult<AuthorRes> {
        return data.db.from(Authors).select()
            .whereWithConditions {
                if(filter.favorite != null) { it += Authors.favorite eq filter.favorite }
                if(filter.type != null) { it += Authors.type eq filter.type }
            }
            .orderBy(filter.order, orderTranslator)
            .limit(filter.offset, filter.limit)
            .toListResult { newAuthorRes(Authors.createEntity(it)) }
    }

    fun create(form: AuthorCreateForm): Int {
        data.db.transaction {
            val name = authorMgr.validateName(form.name)
            val otherNames = authorMgr.validateOtherNames(form.otherNames)

            val annotations = authorMgr.validateAnnotations(form.annotations, form.type)

            val id = data.db.insertAndGenerateKey(Authors) {
                set(it.name, name)
                set(it.otherNames, otherNames)
                set(it.description, form.description)
                set(it.type, form.type)
                set(it.links, form.links)
                set(it.favorite, form.favorite)
                set(it.score, form.score)
                set(it.exportedScore, form.score ?: 0)
                set(it.cachedCount, 0)
                set(it.cachedAnnotations, annotations)
            } as Int

            authorMgr.processAnnotations(id, annotations.asSequence().map { it.id }.toSet(), creating = true)

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

            val newName = form.name.letOpt { authorMgr.validateName(it, id) }
            val newOtherNames = form.otherNames.letOpt { authorMgr.validateOtherNames(it) }

            val newAnnotations = form.annotations.letOpt { authorMgr.validateAnnotations(it, form.type.unwrapOr { record.type }) }

            val newExportedScore = form.score.letOpt {
                it ?: data.db.from(Illusts)
                    .innerJoin(IllustAuthorRelations, Illusts.id eq IllustAuthorRelations.illustId)
                    .select(count(Illusts.exportedScore).aliased("count"))
                    .where { (IllustAuthorRelations.authorId eq id) and (Illusts.type eq Illust.Type.IMAGE) or (Illusts.type eq Illust.Type.IMAGE_WITH_PARENT) }
                    .first().getInt("count")
            }

            data.db.update(Authors) {
                where { it.id eq id }
                newName.applyOpt { set(it.name, this) }
                newOtherNames.applyOpt { set(it.otherNames, this) }
                form.type.applyOpt { set(it.type, this) }
                form.description.applyOpt { set(it.description, this) }
                form.links.applyOpt { set(it.links, this) }
                form.favorite.applyOpt { set(it.favorite, this) }
                form.score.applyOpt { set(it.score, this) }
                newExportedScore.applyOpt { set(it.exportedScore, this) }
                newAnnotations.applyOpt { set(it.cachedAnnotations, this) }
            }

            newAnnotations.letOpt { annotations -> authorMgr.processAnnotations(id, annotations.asSequence().map { it.id }.toSet()) }
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
        }
    }
}