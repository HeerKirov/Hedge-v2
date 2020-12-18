package com.heerkirov.hedge.server.components.service.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.AuthorAnnotationRelations
import com.heerkirov.hedge.server.dao.Authors
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.Annotation
import com.heerkirov.hedge.server.model.Author
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.runIf
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.any
import me.liuwj.ktorm.entity.sequenceOf

class AuthorManager(private val data: DataRepository, private val annotationMgr: AnnotationManager) {
    /**
     * 校验并纠正name，同时对name进行查重。
     * @param thisId 指定此参数时，表示是在对一个项进行更新，此时绕过此id的记录的重名。
     */
    fun validateName(newName: String, thisId: Int? = null): String {
        return newName.trim().apply {
            if(!ManagerTool.checkTagName(this)) throw ParamError("name")
            if(data.db.sequenceOf(Authors).any { (it.name eq newName).runIf(thisId != null) { and (it.id notEq thisId!!) } })
                throw AlreadyExists("Author", "name", newName)
        }
    }

    /**
     * 校验并纠正otherNames。
     */
    fun validateOtherNames(newOtherNames: List<String>?): List<String> {
        return newOtherNames.let { if(it.isNullOrEmpty()) emptyList() else it.map(String::trim) }.apply {
            if(any { !ManagerTool.checkTagName(it) }) throw ParamError("otherNames")
        }
    }

    /**
     * 检验给出的annotations参数的正确性，返回全量表。
     */
    fun validateAnnotations(newAnnotations: List<Any>?, type: Author.Type): List<Author.CachedAnnotation> {
        return if(newAnnotations != null) annotationMgr.analyseAnnotationParam(newAnnotations, target = when(type) {
            Author.Type.UNKNOWN -> Annotation.AnnotationTarget.AUTHOR
            Author.Type.ARTIST -> Annotation.AnnotationTarget.ARTIST
            Author.Type.STUDIO -> Annotation.AnnotationTarget.STUDIO
            Author.Type.PUBLISH -> Annotation.AnnotationTarget.PUBLISH
        }).map { Author.CachedAnnotation(it.key, it.value) } else emptyList()
    }

    /**
     * 将annotations的全量表和旧值解析为adds和deletes，并执行增删。
     */
    fun processAnnotations(thisId: Int, annotationIds: Set<Int>, creating: Boolean = false) {
        val oldAnnotationIds = if(creating) emptySet() else {
            data.db.from(AuthorAnnotationRelations).select(AuthorAnnotationRelations.annotationId)
                .where { AuthorAnnotationRelations.authorId eq thisId }
                .asSequence()
                .map { it[AuthorAnnotationRelations.annotationId]!! }
                .toSet()
        }

        val deleteIds = oldAnnotationIds - annotationIds
        data.db.delete(AuthorAnnotationRelations) { (it.authorId eq thisId) and (it.annotationId inList deleteIds) }

        val addIds = annotationIds - oldAnnotationIds
        data.db.batchInsert(AuthorAnnotationRelations) {
            for (addId in addIds) {
                item {
                    set(it.authorId, thisId)
                    set(it.annotationId, addId)
                }
            }
        }
    }

    /**
     * 该方法使用在设置author时，对author进行校验并导出，返回声明式的author列表。
     * @return 一组author。Int表示tag id，Boolean表示此tag是否为导出tag。
     */
    fun exportAuthor(authors: List<Int>): List<Pair<Int, Boolean>> {
        val ids = data.db.from(Authors).select(Authors.id).where { Authors.id inList authors }.map { it[Authors.id]!! }
        if(ids.size < authors.size) {
            throw ResourceNotExist("authors", authors.toSet() - ids.toSet())
        }

        //author类型的标签没有导出机制，因此直接返回结果。
        return authors.map { Pair(it, false) }
    }

}