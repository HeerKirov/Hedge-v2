package com.heerkirov.hedge.server.components.service.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.TopicAnnotationRelations
import com.heerkirov.hedge.server.dao.Topics
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.model.Topic
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.runIf
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.any
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.firstOrNull
import me.liuwj.ktorm.entity.sequenceOf

class TopicManager(private val data: DataRepository, private val annotationMgr: AnnotationManager) {
    /**
     * 校验并纠正name，同时对name进行查重。
     * @param thisId 指定此参数时，表示是在对一个项进行更新，此时绕过此id的记录的重名。
     */
    fun validateName(newName: String, thisId: Int? = null): String {
        return newName.trim().apply {
            if(!GeneralManager.checkTagName(this)) throw ParamError("name")
            if(data.db.sequenceOf(Topics).any { (it.name eq newName).runIf(thisId != null) { and (it.id notEq thisId!!) } })
                throw AlreadyExists("Topic", "name", newName)
        }
    }

    /**
     * 校验并纠正otherNames。
     */
    fun validateOtherNames(newOtherNames: List<String>?): List<String> {
        return newOtherNames.let { if(it.isNullOrEmpty()) emptyList() else it.map(String::trim) }.apply {
            if(any { !GeneralManager.checkTagName(it) }) throw ParamError("otherNames")
        }
    }

    /**
     * 给出parentId时，对其进行校验。报告parentId不存在的错误，报告当前type和此parent不兼容的错误。
     */
    fun validateParentType(parentId: Int, type: Topic.Type, thisId: Int? = null): Int {
        if(thisId != null && thisId == parentId) throw RecursiveParentError()
        val parent = data.db.sequenceOf(Topics).firstOrNull { it.id eq parentId } ?: throw ResourceNotExist("parentId", parentId)
        if(isLegalTypeConstraint(parent.type, type)) {
            return parentId
        }else{
            throw IllegalConstraintError("type", "parent", parent.type)
        }
    }

    /**
     * 更新type时，检验所有子标签是否能满足此新type的约束。
     */
    fun checkChildrenType(thisId: Int, type: Topic.Type) {
        val illegal = data.db.sequenceOf(Topics).filter { it.parentId eq thisId }.asKotlinSequence().filterNot { isLegalTypeConstraint(type, it.type) }.toList()
        if(illegal.isNotEmpty()) {
            throw IllegalConstraintError("type", "children", illegal.map { it.type })
        }
    }

    /**
     * 检验给出的annotations参数的正确性，返回全量表。
     */
    fun validateAnnotations(newAnnotations: List<Any>?, type: Topic.Type): List<Topic.CachedAnnotation> {
        return if(newAnnotations != null) annotationMgr.analyseAnnotationParam(newAnnotations, target = when(type) {
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
     * 该方法使用在设置topic时，对topic进行校验并导出，返回声明式的topic列表。
     * @return 一组topic。Int表示topic id，Boolean表示此topic是否为导出tag。
     */
    fun exportTopic(topics: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Topics).select(Topics.id).where { Topics.id inList topics }.map { it[Topics.id]!! }
        if(ids.size < topics.size) {
            throw ResourceNotExist("topics", topics.toSet() - ids.toSet())
        }

        TODO("topic的导出")
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