package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.AnnotationManager
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.TagAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ResourceNotSuitable
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.tools.checkTagName
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.entity.toList

class TagKit(private val data: DataRepository, private val annotationManager: AnnotationManager) {
    /**
     * 校验并纠正name。
     */
    fun validateName(newName: String): String {
        return newName.trim().apply {
            if(!checkTagName(this)) throw ParamError("name")
        }
    }

    /**
     * 校验并纠正otherNames。
     */
    fun validateOtherNames(newOtherNames: List<String>?): List<String> {
        return newOtherNames.let { if(it.isNullOrEmpty()) emptyList() else it.map(String::trim) }.apply {
            if(any { !checkTagName(it) }) throw ParamError("otherNames")
        }
    }

    /**
     * 校验并纠正links。
     */
    fun validateLinks(newLinks: List<Int>?): List<Int>? {
        return if(newLinks.isNullOrEmpty()) null else {
            val links = data.db.sequenceOf(Tags).filter { it.id inList newLinks }.toList()
            if (links.size < newLinks.size) {
                throw ResourceNotExist("links", newLinks.toSet() - links.asSequence().map { it.id }.toSet())
            }
            newLinks
        }
    }

    /**
     * 校验并纠正examples。
     */
    fun validateExamples(newExamples: List<Int>?): List<Int>? {
        return if(newExamples.isNullOrEmpty()) null else {
            val examples = data.db.sequenceOf(Illusts).filter { it.id inList newExamples }.toList()
            if (examples.size < newExamples.size) {
                throw ResourceNotExist("examples", newExamples.toSet() - examples.asSequence().map { it.id }.toSet())
            }
            for (example in examples) {
                if (example.type == Illust.Type.COLLECTION) {
                    throw ResourceNotSuitable("examples", example.id)
                }
            }
            newExamples
        }
    }

    /**
     * 检验给出的annotations参数的正确性，根据需要add/delete。
     */
    fun processAnnotations(thisId: Int, newAnnotations: List<Any>?, creating: Boolean = false) {
        val annotationIds = if(newAnnotations != null) annotationManager.analyseAnnotationParam(newAnnotations, Annotation.AnnotationTarget.TAG) else emptyMap()
        val oldAnnotationIds = if(creating) emptySet() else {
            data.db.from(TagAnnotationRelations).select(TagAnnotationRelations.annotationId)
                .where { TagAnnotationRelations.tagId eq thisId }
                .asSequence()
                .map { it[TagAnnotationRelations.annotationId]!! }
                .toSet()
        }

        val deleteIds = oldAnnotationIds - annotationIds.keys
        data.db.delete(TagAnnotationRelations) { (it.tagId eq thisId) and (it.annotationId inList deleteIds) }

        val addIds = annotationIds.keys - oldAnnotationIds
        data.db.batchInsert(TagAnnotationRelations) {
            for (addId in addIds) {
                item {
                    set(it.tagId, thisId)
                    set(it.annotationId, addId)
                }
            }
        }
    }
}