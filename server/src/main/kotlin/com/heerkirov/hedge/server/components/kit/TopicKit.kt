package com.heerkirov.hedge.server.components.kit

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.manager.AnnotationManager
import com.heerkirov.hedge.server.dao.meta.TopicAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.meta.Topic
import com.heerkirov.hedge.server.utils.business.checkTagName
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.runIf
import org.ktorm.dsl.*
import org.ktorm.entity.any
import org.ktorm.entity.filter
import org.ktorm.entity.firstOrNull
import org.ktorm.entity.sequenceOf

class TopicKit(private val data: DataRepository, private val annotationManager: AnnotationManager) {
    /**
     * 校验并纠正name，同时对name进行查重。
     * @param thisId 指定此参数时，表示是在对一个项进行更新，此时绕过此id的记录的重名。
     * @throws AlreadyExists ("Topic", "name", string) 此名称的topic已存在
     */
    fun validateName(newName: String, thisId: Int? = null): String {
        val trimName = newName.trim()

        if(!checkTagName(trimName)) throw be(ParamError("name"))
        if(data.db.sequenceOf(Topics).any { (it.name eq trimName).runIf(thisId != null) { and (it.id notEq thisId!!) } })
            throw be(AlreadyExists("Topic", "name", trimName))

        return trimName
    }

    /**
     * 校验并纠正otherNames。
     */
    fun validateOtherNames(newOtherNames: List<String>?): List<String> {
        return newOtherNames.let { if(it.isNullOrEmpty()) emptyList() else it.map(String::trim) }.apply {
            if(any { !checkTagName(it) }) throw be(ParamError("otherNames"))
        }
    }

    /**
     * 校验并纠正keywords。
     */
    fun validateKeywords(newKeywords: List<String>?): List<String> {
        return newKeywords.let { if(it.isNullOrEmpty()) emptyList() else it.map(String::trim) }.apply {
            if(any { !checkTagName(it) }) throw be(ParamError("keywords"))
        }
    }

    /**
     * 给出parentId时，对其进行校验。报告parentId不存在的错误，报告当前type和此parent不兼容的错误。
     * @throws RecursiveParentError parentId出现闭环
     * @throws ResourceNotExist ("parentId", number) 给出的parent不存在。给出parentId
     * @throws IllegalConstraintError ("type", "parent", TopicType[]) 当前的type与parent的type不兼容。给出parent的type
     */
    fun validateParentType(parentId: Int, type: Topic.Type, thisId: Int? = null): Int {
        if(thisId != null && thisId == parentId) throw be(RecursiveParentError())
        val parent = data.db.sequenceOf(Topics).firstOrNull { it.id eq parentId } ?: throw be(ResourceNotExist("parentId", parentId))
        if(isLegalTypeConstraint(parent.type, type)) {
            return parentId
        }else{
            throw be(IllegalConstraintError("type", "parent", listOf(parent.type)))
        }
    }

    /**
     * 更新type时，检验所有子标签是否能满足此新type的约束。
     * @throws IllegalConstraintError ("type", "children", TopicType[]) 当前的type与children的type不兼容。给出children的type
     */
    fun checkChildrenType(thisId: Int, type: Topic.Type) {
        val illegal = data.db.sequenceOf(Topics).filter { it.parentId eq thisId }.asKotlinSequence().filterNot { isLegalTypeConstraint(type, it.type) }.toList()
        if(illegal.isNotEmpty()) {
            throw be(IllegalConstraintError("type", "children", illegal.map { it.type }))
        }
    }

    /**
     * 检验给出的annotations参数的正确性，返回全量表。
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     */
    fun validateAnnotations(newAnnotations: List<Any>?, type: Topic.Type): List<Topic.CachedAnnotation> {
        return if(newAnnotations != null) annotationManager.analyseAnnotationParam(newAnnotations, target = when(type) {
            Topic.Type.UNKNOWN -> Annotation.AnnotationTarget.TOPIC
            Topic.Type.CHARACTER -> Annotation.AnnotationTarget.CHARACTER
            Topic.Type.WORK -> Annotation.AnnotationTarget.WORK
            Topic.Type.COPYRIGHT -> Annotation.AnnotationTarget.COPYRIGHT
        }).map { Topic.CachedAnnotation(it.key, it.value) } else emptyList()
    }

    /**
     * 将annotations的全量表和旧值解析为adds和deletes，并执行增删。
     */
    fun processAnnotations(thisId: Int, annotationIds: Set<Int>, creating: Boolean = false) {
        val oldAnnotationIds = if(creating) emptySet() else {
            data.db.from(TopicAnnotationRelations).select(TopicAnnotationRelations.annotationId)
                .where { TopicAnnotationRelations.topicId eq thisId }
                .asSequence()
                .map { it[TopicAnnotationRelations.annotationId]!! }
                .toSet()
        }

        val deleteIds = oldAnnotationIds - annotationIds
        data.db.delete(TopicAnnotationRelations) { (it.topicId eq thisId) and (it.annotationId inList deleteIds) }

        val addIds = annotationIds - oldAnnotationIds
        data.db.batchInsert(TopicAnnotationRelations) {
            for (addId in addIds) {
                item {
                    set(it.topicId, thisId)
                    set(it.annotationId, addId)
                }
            }
        }
    }

    /**
     * 校验child和parent之间的类型约束是否合法。
     */
    private fun isLegalTypeConstraint(parent: Topic.Type, child: Topic.Type): Boolean {
        return child == Topic.Type.UNKNOWN || parent == Topic.Type.UNKNOWN ||
                (child == Topic.Type.COPYRIGHT && parent == Topic.Type.COPYRIGHT) ||
                (child == Topic.Type.WORK && (parent == Topic.Type.WORK || parent == Topic.Type.COPYRIGHT)) ||
                (child == Topic.Type.CHARACTER && (parent == Topic.Type.WORK || parent == Topic.Type.COPYRIGHT))
    }
}