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
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.business.checkTagName
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import org.ktorm.dsl.*
import org.ktorm.entity.filter
import org.ktorm.entity.first
import org.ktorm.entity.sequenceOf
import org.ktorm.entity.toList
import java.util.*

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
     * 校验并纠正links。tag的link必须是非虚拟的。
     */
    fun validateLinks(newLinks: List<Int>?): List<Int>? {
        return if(newLinks.isNullOrEmpty()) null else {
            val links = data.db.sequenceOf(Tags).filter { it.id inList newLinks }.toList()

            if(links.size < newLinks.size) {
                throw ResourceNotExist("links", newLinks.toSet() - links.asSequence().map { it.id }.toSet())
            }

            val wrongLinks = links.filter { it.type === Tag.Type.VIRTUAL_ADDR }
            if(wrongLinks.isNotEmpty()) {
                throw ResourceNotSuitable("links", wrongLinks.map { it.id })
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

    /**
     * 从给出的tag开始向上请求，拿到它的所有parent address。最终结果不包括初始tag。address的顺序是root在最前，直接父标签在最后。
     */
    fun getAllParents(tag: Tag): List<Tag> {
        if(tag.parentId == null) {
            return emptyList()
        }

        val ret = LinkedList<Tag>()
        var current = tag
        while (current.parentId != null) {
            val next = data.db.sequenceOf(Tags).first { it.id eq current.parentId!! }
            ret.push(next)
            current = next
        }

        return ret
    }
}