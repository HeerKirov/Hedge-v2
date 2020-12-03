package com.heerkirov.hedge.server.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.Illusts
import com.heerkirov.hedge.server.dao.Tags
import com.heerkirov.hedge.server.exceptions.ParamError
import com.heerkirov.hedge.server.exceptions.ResourceNotAvailable
import com.heerkirov.hedge.server.exceptions.ResourceNotExist
import com.heerkirov.hedge.server.model.Illust
import me.liuwj.ktorm.dsl.inList
import me.liuwj.ktorm.entity.filter
import me.liuwj.ktorm.entity.sequenceOf
import me.liuwj.ktorm.entity.toList

class TagManager(private val data: DataRepository) {

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
                throw ResourceNotExist("links", (newLinks.toSet() - links.asSequence().map { it.id }.toSet()).joinToString(", "))
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
                throw ResourceNotExist(
                    "examples",
                    (newExamples.toSet() - examples.asSequence().map { it.id }.toSet()).joinToString(", ")
                )
            }
            for (example in examples) {
                if (example.type == Illust.Type.COLLECTION) {
                    throw ResourceNotAvailable("examples", example.id)
                }
            }
            newExamples
        }
    }

    /**
     * 检查tag的命名是否符合要求。
     */
    private fun checkTagName(name: String): Boolean {
        //检查tag name是否符合规范。

        //不能不包含非空字符
        if(name.isBlank()) {
            return false
        }

        //不能包含禁用符号' " ` . |
        for (c in disableCharacter) {
            if(name.contains(c)) {
                return false
            }
        }
        return true
    }

    private val disableCharacter = arrayOf('\'', '"', '`', '.', '|')
}