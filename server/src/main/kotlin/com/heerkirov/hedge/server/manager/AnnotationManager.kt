package com.heerkirov.hedge.server.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.Annotations
import com.heerkirov.hedge.server.exceptions.AlreadyExists
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ParamTypeError
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.utils.applyIf
import com.heerkirov.hedge.server.utils.ktorm.asSequence
import com.heerkirov.hedge.server.utils.runIf
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.any
import me.liuwj.ktorm.entity.sequenceOf

class AnnotationManager(private val data: DataRepository) {
    /**
     * 校验并纠正name，同时对name进行查重。
     * @param thisId 指定此参数时，表示是在对一个项进行更新，此时绕过此id的记录的重名。
     */
    fun validateName(newName: String, thisId: Int? = null): String {
        return newName.trim().apply {
            if(!ManagerTool.checkTagName(this)) throw ParamError("name")
            if(data.db.sequenceOf(Annotations).any { (it.name eq newName).runIf(thisId != null) { and (it.id notEq thisId!!) } })
                throw AlreadyExists("Annotation", "name", newName)
        }
    }

    /**
     * 解析一个由string和int组成的annotations列表，对其校验、纠错，并返回一个等价的、只包含id的集合。
     * @throws ParamTypeError 存在元素不是int或string时，抛出此异常。
     * @throws ResourceNotExist 有元素不存在时，抛出此异常。
     */
    fun analyseAnnotationParam(annotations: List<Any>, paramName: String = "annotations"): Set<Int> {
        //TODO 添加一个按类型校验的参数
        if(annotations.any { it !is Int && it !is String }) {
            throw ParamTypeError(paramName, " must be id(Int) or name(String).")
        }
        val ids = annotations.filterIsInstance<Int>()
        val names = annotations.filterIsInstance<String>()

        data.db.from(Annotations).select(Annotations.id)
            .where { Annotations.id inList ids }
            .also { rowSet ->
                if(rowSet.totalRecords < ids.size) {
                    val minus = ids.toSet() - rowSet.map { it[Annotations.id] }.toSet()
                    throw ResourceNotExist(paramName, minus.joinToString(", "))
                }
            }

        val idFromNames = data.db.from(Annotations).select(Annotations.id, Annotations.name)
            .where { Annotations.name inList names }
            .asSequence()
            .map { Pair(it[Annotations.name]!!, it[Annotations.id]!!) }
            .toMap()
            .also { rowSet ->
                if(rowSet.size < names.size) {
                    val minus = names.toSet() - rowSet.keys
                    throw ResourceNotExist(paramName, minus.joinToString(", "))
                }
            }.values

        return (ids + idFromNames).toSet()
    }
}