package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.model.Illust
import com.heerkirov.hedge.server.model.Tag
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*

class TagService(private val repo: DataRepository) {
    fun list(): List<TagRes> {
        return repo.db.sequenceOf(Tags)
            .map { newTagRes(it) }
    }

    fun tree(): List<TagTreeNode> {
        val records = repo.db.sequenceOf(Tags).asKotlinSequence().groupBy { it.parentId }

        fun generateNodeList(key: Int?): List<TagTreeNode>? = records[key]
            ?.sortedBy { it.ordinal }
            ?.map { newTagTreeNode(it, generateNodeList(it.id)) }

        return generateNodeList(null) ?: emptyList()
    }

    fun create(form: TagCreateForm): Int {
        //检查name是否符合命名规范
        if(!checkTagName(form.name)) throw ParamError("name")
        //检查other names是否符合命名规范
        if(!form.otherNames.isNullOrEmpty() && form.otherNames.any { !checkTagName(it) }) throw ParamError("otherNames")

        repo.db.transaction {
            //检查parent是否存在
            if(form.parentId != null && repo.db.sequenceOf(Tags).none { it.id eq form.parentId }) throw ResourceNotExist("parentId", form.parentId)

            val tagsInParent = repo.db.sequenceOf(Tags)
                .filter { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } }
                .toList()

            //检查标签重名
            if(form.type == Tag.Type.TAG) {
                //tag类型的标签禁止全局重名
                if(repo.db.sequenceOf(Tags).any { it.name eq form.name }) throw AlreadyExists("Tag", "name", form.name)
            }else{
                //addr类型的标签禁止在相同的parent下重名
                if(tagsInParent.any { it.name == form.name }) throw AlreadyExists("Tag", "name", form.name)
            }

            //存在link时，检查link的目标是否存在
            val links = if(form.links.isNullOrEmpty()) null else {
                val links = repo.db.sequenceOf(Tags).filter { it.id inList form.links }.toList()
                if(links.size < form.links.size) {
                    throw ResourceNotExist("links", (form.links.toSet() - links.asSequence().map { it.id }.toSet()).joinToString(", "))
                }
                form.links
            }

            //存在example时，检查example的目标是否存在，以及限制illust不能是collection
            val examples = if(form.examples.isNullOrEmpty()) null else {
                val examples = repo.db.sequenceOf(Illusts).filter { it.id inList form.examples }.toList()
                if(examples.size < form.examples.size) {
                    throw ResourceNotExist("examples", (form.examples.toSet() - examples.asSequence().map { it.id }.toSet()).joinToString(", "))
                }
                for (example in examples) {
                    if(example.type == Illust.Type.COLLECTION) {
                        throw ResourceNotAvailable("examples", example.id)
                    }
                }
                form.examples
            }

            val ordinal = if(form.ordinal == null) {
                //未指定ordinal时，将其排在序列的末尾，相当于当前的序列长度
                tagsInParent.size
            }else{
                //指定时，限制ordinal的值在[0, count]的范围内
                val ordinal = when {
                    form.ordinal < 0 -> 0
                    form.ordinal >= tagsInParent.size -> tagsInParent.size
                    else -> form.ordinal
                }
                //同parent下，ordinal>=newOrdinal的那些tag，向后顺延一位
                repo.db.update(Tags) {
                    where { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq ordinal)  }
                    set(it.ordinal, it.ordinal + 1)
                }
                ordinal
            }

            return repo.db.insertAndGenerateKey(Tags) {
                set(it.name, form.name)
                set(it.otherNames, form.otherNames?.map(String::trim) ?: emptyList())
                set(it.ordinal, ordinal)
                set(it.parentId, form.parentId)
                set(it.type, form.type)
                set(it.isGroup, form.group)
                set(it.description, form.description)
                set(it.links, links)
                set(it.examples, examples)
                set(it.exportedScore, null)
                set(it.cachedCount, 0)
            } as Int
        }
    }

    fun get(id: Int): TagDetailRes {
        return repo.db.sequenceOf(Tags).firstOrNull { it.id eq id }
            ?.let { newTagDetailRes(it) }
            ?: throw NotFound()
    }

    fun update(id: Int, form: TagUpdateForm) {
        repo.db.transaction {
            val record = repo.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw NotFound()

            //TODO 处理parentId更换，同时要处理约束(parent是否存在，同级addr是否重名冲突)
            //TODO 处理ordinal和重排序，还要和parentId的变换一同处理
            //TODO links发生变化时，会引发关联内容重导出
            //TODO type的类型发生变化时，会引发关联内容重导出。将type从tag变为addr不删除直接引用

            //TODO 关联内容的标签重导出过程可能耗时巨大，因此做一个持久化到数据库的消息队列

            val newName = form.name.applyOpt {
                if(!checkTagName(this)) throw ParamError("name")
            }
            val newOtherNames = form.otherNames.applyOpt {
                if(!isNullOrEmpty() && any { n -> !checkTagName(n) }) throw ParamError("otherNames")
            }
            val newLinks = form.links.mapOpt {
                if(this.isNullOrEmpty()) null else {
                    val links = repo.db.sequenceOf(Tags).filter { it.id inList this }.toList()
                    if (links.size < this.size) {
                        throw ResourceNotExist("links", (this.toSet() - links.asSequence().map { it.id }.toSet()).joinToString(", "))
                    }
                    this
                }
            }
            val newExamples = form.examples.mapOpt {
                if(this.isNullOrEmpty()) null else {
                    val examples = repo.db.sequenceOf(Illusts).filter { it.id inList this }.toList()
                    if(examples.size < this.size) {
                        throw ResourceNotExist("examples", (this.toSet() - examples.asSequence().map { it.id }.toSet()).joinToString(", "))
                    }
                    for (example in examples) {
                        if(example.type == Illust.Type.COLLECTION) {
                            throw ResourceNotAvailable("examples", example.id)
                        }
                    }
                    this
                }
            }

            repo.db.update(Tags) {
                where { it.id eq id }

                newName.applyOpt { set(it.name, this) }
                newOtherNames.applyOpt { set(it.otherNames, this) }
                form.description.applyOpt { set(it.description, this) }
                newLinks.applyOpt { set(it.links, this) }
                newExamples.applyOpt { set(it.examples, this) }
            }
        }
    }

    fun delete(id: Int) {
        fun recursionDelete(id: Int) {
            repo.db.delete(Tags) { it.id eq id }
            repo.db.delete(IllustTagRelations) { it.tagId eq id }
            repo.db.delete(AlbumTagRelations) { it.tagId eq id }
            repo.db.delete(TagAnnotationRelations) { it.tagId eq id }
            val children = repo.db.from(Tags).select(Tags.id).where { Tags.id eq id }.map { it[Tags.id]!! }
            for (child in children) {
                recursionDelete(child)
            }
        }
        repo.db.transaction {
            if(repo.db.sequenceOf(Tags).none { it.id eq id }) {
                throw NotFound()
            }
            recursionDelete(id)
        }
    }

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