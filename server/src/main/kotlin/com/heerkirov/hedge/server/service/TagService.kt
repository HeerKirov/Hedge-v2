package com.heerkirov.hedge.server.service

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.dao.*
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.form.*
import com.heerkirov.hedge.server.manager.TagManager
import com.heerkirov.hedge.server.model.Tag
import com.heerkirov.hedge.server.utils.anyOpt
import com.heerkirov.hedge.server.utils.applyIf
import com.heerkirov.hedge.server.utils.optOf
import com.heerkirov.hedge.server.utils.undefined
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*

class TagService(private val data: DataRepository, private val tagMgr: TagManager) {
    fun list(): List<TagRes> {
        return data.db.sequenceOf(Tags).map { newTagRes(it) }
    }

    fun tree(): List<TagTreeNode> {
        val records = data.db.sequenceOf(Tags).asKotlinSequence().groupBy { it.parentId }

        fun generateNodeList(key: Int?): List<TagTreeNode>? = records[key]
            ?.sortedBy { it.ordinal }
            ?.map { newTagTreeNode(it, generateNodeList(it.id)) }

        return generateNodeList(null) ?: emptyList()
    }

    fun create(form: TagCreateForm): Int {
        val name = tagMgr.validateName(form.name)
        val otherNames = tagMgr.validateOtherNames(form.otherNames)

        data.db.transaction {
            //检查parent是否存在
            if(form.parentId != null && data.db.sequenceOf(Tags).none { it.id eq form.parentId }) throw ResourceNotExist("parentId", form.parentId)

            //检查标签重名
            //addr类型的标签在相同的parent下重名
            //tag类型的标签除上一条外，还禁止与全局的其他tag类型标签重名
            if(form.type == Tag.Type.TAG) {
                if(data.db.sequenceOf(Tags).any { (if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } or (it.type eq Tag.Type.TAG)) and (it.name eq name) }) throw AlreadyExists("Tag", "name", name)
            }else{
                if(data.db.sequenceOf(Tags).any { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } and (it.name eq name) }) throw AlreadyExists("Tag", "name", name)
            }

            //存在link时，检查link的目标是否存在
            val links = tagMgr.validateLinks(form.links)

            //存在example时，检查example的目标是否存在，以及限制illust不能是collection
            val examples = tagMgr.validateExamples(form.examples)

            val tagCountInParent = lazy {
                data.db.sequenceOf(Tags)
                    .filter { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } }
                    .count()
            }

            //未指定ordinal时，将其排在序列的末尾，相当于当前的序列长度
            //已指定ordinal时，按照指定的ordinal排序，并且不能超出[0, count]的范围
            val ordinal = if(form.ordinal == null) {
                tagCountInParent.value
            }else when {
                form.ordinal < 0 -> 0
                form.ordinal >= tagCountInParent.value -> tagCountInParent.value
                else -> form.ordinal
            }.also { ordinal ->
                data.db.update(Tags) {
                    //同parent下，ordinal>=newOrdinal的那些tag，向后顺延一位
                    where { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq ordinal)  }
                    set(it.ordinal, it.ordinal + 1)
                }
            }

            val id = data.db.insertAndGenerateKey(Tags) {
                set(it.name, name)
                set(it.otherNames, otherNames)
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

            tagMgr.processAnnotations(id, form.annotations, creating = true)

            return id
        }
    }

    fun get(id: Int): TagDetailRes {
        val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw NotFound()

        val annotations = data.db.from(TagAnnotationRelations)
            .innerJoin(Annotations, TagAnnotationRelations.annotationId eq Annotations.id)
            .select(Annotations.id, Annotations.name, Annotations.canBeExported)
            .where { TagAnnotationRelations.tagId eq id }
            .map { TagDetailRes.Annotation(it[Annotations.id]!!, it[Annotations.name]!!, it[Annotations.canBeExported]!!) }

        return newTagDetailRes(tag, annotations)
    }

    fun update(id: Int, form: TagUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw NotFound()

            //TODO 关联内容的标签重导出过程可能耗时巨大，因此做一个持久化到数据库的任务队列。
            //     links发生变化时，会引发关联内容重导出
            //     type的类型发生变化时，会引发关联内容重导出

            val newName = form.name.letOpt { tagMgr.validateName(it) }
            val newOtherNames = form.otherNames.letOpt { tagMgr.validateOtherNames(it) }
            val newLinks = form.links.runOpt { tagMgr.validateLinks(this) }
            val newExamples = form.examples.runOpt { tagMgr.validateExamples(this) }

            val (newParentId, newOrdinal) = if(form.parentId.isPresent && form.parentId.value != record.parentId) {
                //parentId发生了变化
                val newParentId = form.parentId.value

                if(newParentId != null) {
                    tailrec fun recursiveCheckParent(id: Int, chains: Set<Int>) {
                        if(id in chains) {
                            //在过去经历过的parent中发现了重复的id，判定存在闭环
                            throw RecursiveParentError()
                        }
                        val parent = data.db.from(Tags)
                            .select(Tags.parentId)
                            .where { Tags.id eq id }
                            .limit(0, 1)
                            .map { optOf(it[Tags.parentId]) }
                            .firstOrNull()
                            //检查parent是否存在
                            ?: throw ResourceNotExist("parentId", newParentId)
                        val parentId = parent.value
                        if(parentId != null) recursiveCheckParent(parentId, chains + id)
                    }

                    recursiveCheckParent(newParentId, setOf(id))
                }

                //调整旧的parent下的元素顺序
                data.db.update(Tags) {
                    where { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greater record.ordinal) }
                    set(it.ordinal, it.ordinal - 1)
                }

                val tagsInNewParent = data.db.sequenceOf(Tags)
                    .filter { if(newParentId != null) { Tags.parentId eq newParentId }else{ Tags.parentId.isNull() } }
                    .toList()

                Pair(optOf(newParentId), if(form.ordinal.isPresent) {
                    //指定了新的ordinal
                    val max = tagsInNewParent.size
                    val newOrdinal = if(form.ordinal.value > max) max else form.ordinal.value

                    data.db.update(Tags) {
                        where { if(newParentId != null) { Tags.parentId eq newParentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq newOrdinal) }
                        set(it.ordinal, it.ordinal + 1)
                    }
                    optOf(newOrdinal)
                }else{
                    //没有指定新ordinal，追加到末尾
                    optOf(tagsInNewParent.size)
                })
            }else{
                //parentId没有变化，只在当前范围内变动
                val tagsInParent = data.db.sequenceOf(Tags)
                    .filter { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } }
                    .toList()
                Pair(undefined(), if(form.ordinal.isUndefined || form.ordinal.value == record.ordinal) undefined() else {
                    //ordinal发生了变化
                    val max = tagsInParent.size
                    val newOrdinal = if(form.ordinal.value > max) max else form.ordinal.value
                    if(newOrdinal > record.ordinal) {
                        data.db.update(Tags) {
                            where { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greater record.ordinal) and (it.ordinal lessEq newOrdinal) }
                            set(it.ordinal, it.ordinal - 1)
                        }
                    }else{
                        data.db.update(Tags) {
                            where { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq newOrdinal) and (it.ordinal less record.ordinal) }
                            set(it.ordinal, it.ordinal + 1)
                        }
                    }
                    optOf(newOrdinal)
                })
            }

            applyIf(form.type.isPresent || form.name.isPresent || form.parentId.isPresent) {
                //type/name/parentId的变化会触发重名检查
                val name = newName.unwrapOr { record.name }
                val type = form.type.unwrapOr { record.type }
                val parentId = newParentId.unwrapOr { record.parentId }
                //检查标签重名
                //addr类型的标签在相同的parent下重名
                //tag类型的标签除上一条外，还禁止与全局的其他tag类型标签重名
                //更新动作还要排除自己，防止与自己重名的检查
                if(type == Tag.Type.TAG) {
                    if(data.db.sequenceOf(Tags).any { (if(parentId != null) { Tags.parentId eq parentId }else{ Tags.parentId.isNull() } or (it.type eq Tag.Type.TAG)) and (it.name eq name) and (it.id notEq record.id) }) throw AlreadyExists("Tag", "name", name)
                }else{
                    if(data.db.sequenceOf(Tags).any { if(parentId != null) { Tags.parentId eq parentId }else{ Tags.parentId.isNull() } and (it.name eq name) and (it.id notEq record.id) }) throw AlreadyExists("Tag", "name", name)
                }
            }

            form.annotations.letOpt { newAnnotations -> tagMgr.processAnnotations(id, newAnnotations) }

            if(anyOpt(newName, newOtherNames, form.type, form.description, newLinks, newExamples, newParentId, newOrdinal)) {
                data.db.update(Tags) {
                    where { it.id eq id }

                    newName.applyOpt { set(it.name, this) }
                    newOtherNames.applyOpt { set(it.otherNames, this) }
                    form.type.applyOpt { set(it.type, this) }
                    form.description.applyOpt { set(it.description, this) }
                    newLinks.applyOpt { set(it.links, this) }
                    newExamples.applyOpt { set(it.examples, this) }
                    newParentId.applyOpt { set(it.parentId, this) }
                    newOrdinal.applyOpt { set(it.ordinal, this) }
                }
            }

        }
    }

    fun delete(id: Int) {
        fun recursionDelete(id: Int) {
            data.db.delete(Tags) { it.id eq id }
            data.db.delete(IllustTagRelations) { it.tagId eq id }
            data.db.delete(AlbumTagRelations) { it.tagId eq id }
            data.db.delete(TagAnnotationRelations) { it.tagId eq id }
            //TODO 删除标签时将关联的对象的标签重导出
            val children = data.db.from(Tags).select(Tags.id).where { Tags.parentId eq id }.map { it[Tags.id]!! }
            for (child in children) {
                recursionDelete(child)
            }
        }
        data.db.transaction {
            if(data.db.sequenceOf(Tags).none { it.id eq id }) {
                throw NotFound()
            }
            recursionDelete(id)
        }
    }

    class RecursiveParentError : BadRequestException("RECURSIVE_PARENT", "Param 'parentId' has recursive.")
}