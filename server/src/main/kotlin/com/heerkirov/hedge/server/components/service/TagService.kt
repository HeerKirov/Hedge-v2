package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.backend.exporter.AlbumMetadataExporterTask
import com.heerkirov.hedge.server.components.backend.exporter.BackendExporter
import com.heerkirov.hedge.server.components.backend.exporter.IllustMetadataExporterTask
import com.heerkirov.hedge.server.components.backend.exporter.TagGlobalSortExporterTask
import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.transaction
import com.heerkirov.hedge.server.exceptions.*
import com.heerkirov.hedge.server.dto.*
import com.heerkirov.hedge.server.components.kit.TagKit
import com.heerkirov.hedge.server.components.manager.SourceMappingManager
import com.heerkirov.hedge.server.components.manager.query.QueryManager
import com.heerkirov.hedge.server.dao.album.AlbumTagRelations
import com.heerkirov.hedge.server.dao.illust.IllustTagRelations
import com.heerkirov.hedge.server.dao.illust.Illusts
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.TagAnnotationRelations
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.illust.FileRecords
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.business.takeThumbnailFilepath
import com.heerkirov.hedge.server.utils.*
import com.heerkirov.hedge.server.utils.ktorm.OrderTranslator
import com.heerkirov.hedge.server.utils.ktorm.orderBy
import com.heerkirov.hedge.server.utils.types.*
import org.ktorm.dsl.*
import org.ktorm.entity.*

class TagService(private val data: DataRepository,
                 private val kit: TagKit,
                 private val queryManager: QueryManager,
                 private val sourceMappingManager: SourceMappingManager,
                 private val backendExporter: BackendExporter) {
    private val orderTranslator = OrderTranslator {
        "id" to Tags.id
        "name" to Tags.name
        "ordinal" to Tags.ordinal
        "createTime" to Tags.createTime
        "updateTime" to Tags.updateTime
    }

    fun list(filter: TagFilter): ListResult<TagRes> {
        return data.db.from(Tags).select()
            .whereWithConditions {
                if(filter.parent != null) { it += Tags.parentId eq filter.parent }
                if(filter.type != null) { it += Tags.type eq filter.type }
                if(filter.group != null) { it += if(filter.group) Tags.isGroup notEq Tag.IsGroup.NO else Tags.isGroup eq Tag.IsGroup.NO }
                if(filter.search != null) { it += (Tags.name like "%${filter.search}%") or (Tags.otherNames like "%${filter.search}%") }
            }
            .orderBy(orderTranslator, filter.order, default = ascendingOrderItem("ordinal"))
            .limit(filter.offset, filter.limit)
            .toListResult {
                newTagRes(Tags.createEntity(it))
            }
    }

    fun tree(filter: TagTreeFilter): List<TagTreeNode> {
        val records = data.db.sequenceOf(Tags).asKotlinSequence().groupBy { it.parentId }

        fun generateNodeList(key: Int?): List<TagTreeNode>? = records[key]
            ?.sortedBy { it.ordinal }
            ?.map { newTagTreeNode(it, generateNodeList(it.id)) }

        return generateNodeList(filter.parent) ?: emptyList()
    }

    /**
     * @throws AlreadyExists ("Tag", "name", string) 在相同的影响范围内，此名称的标签已存在
     * @throws CannotGiveColorError 不是根节点，不能修改颜色
     * @throws ResourceNotExist ("parentId", number) 给出的parent id不存在
     * @throws ResourceNotExist ("links", number[]) links中给出的tag不存在。给出不存在的link id列表
     * @throws ResourceNotExist ("examples", number[]) examples中给出的image不存在。给出不存在的image id列表
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("links", number[]) links中给出的部分资源不适用，虚拟地址段是不能被link的。给出不适用的link id列表
     * @throws ResourceNotSuitable ("examples", number[]) examples中给出的部分资源不适用，collection不能用作example。给出不适用的link id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     */
    fun create(form: TagCreateForm): Int {
        val name = kit.validateName(form.name)
        val otherNames = kit.validateOtherNames(form.otherNames)

        data.db.transaction {
            //检查parent是否存在
            val parent = form.parentId?.let { parentId -> data.db.sequenceOf(Tags).firstOrNull { it.id eq parentId } ?: throw be(ResourceNotExist("parentId", form.parentId)) }

            //检查颜色，只有顶层tag允许指定颜色
            if(form.color != null && parent != null) throw be(CannotGiveColorError())

            //检查标签重名
            //addr类型的标签在相同的parent下重名
            //tag类型的标签除上一条外，还禁止与全局的其他tag类型标签重名
            if(form.type == Tag.Type.TAG) {
                if(data.db.sequenceOf(Tags).any { (if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } or (it.type eq Tag.Type.TAG)) and (it.name eq name) }) throw be(AlreadyExists("Tag", "name", name))
            }else{
                if(data.db.sequenceOf(Tags).any { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } and (it.name eq name) }) throw be(AlreadyExists("Tag", "name", name))
            }

            //存在link时，检查link的目标是否存在
            val links = kit.validateLinks(form.links)

            //存在example时，检查example的目标是否存在，以及限制illust不能是collection
            val examples = kit.validateExamples(form.examples)

            val tagCountInParent by lazy {
                data.db.sequenceOf(Tags)
                    .filter { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } }
                    .count()
            }

            //未指定ordinal时，将其排在序列的末尾，相当于当前的序列长度
            //已指定ordinal时，按照指定的ordinal排序，并且不能超出[0, count]的范围
            val ordinal = if(form.ordinal == null) {
                tagCountInParent
            }else when {
                form.ordinal <= 0 -> 0
                form.ordinal >= tagCountInParent -> tagCountInParent
                else -> form.ordinal
            }.also { ordinal ->
                data.db.update(Tags) {
                    //同parent下，ordinal>=newOrdinal的那些tag，向后顺延一位
                    where { if(form.parentId != null) { Tags.parentId eq form.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq ordinal)  }
                    set(it.ordinal, it.ordinal + 1)
                }
            }

            val createTime = DateTime.now()

            val id = data.db.insertAndGenerateKey(Tags) {
                set(it.name, name)
                set(it.otherNames, otherNames)
                set(it.ordinal, ordinal)
                set(it.parentId, form.parentId)
                set(it.type, form.type)
                set(it.isGroup, form.group)
                set(it.description, form.description)
                set(it.color, parent?.color ?: form.color)
                set(it.links, links)
                set(it.examples, examples)
                set(it.exportedScore, null)
                set(it.cachedCount, 0)
                set(it.createTime, createTime)
                set(it.updateTime, createTime)
            } as Int

            form.mappingSourceTags?.also { sourceMappingManager.update(MetaType.TAG, id, it) }

            kit.processAnnotations(id, form.annotations, creating = true)

            backendExporter.add(TagGlobalSortExporterTask)

            return id
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun get(id: Int): TagDetailRes {
        val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw be(NotFound())

        val annotations = data.db.from(TagAnnotationRelations)
            .innerJoin(Annotations, TagAnnotationRelations.annotationId eq Annotations.id)
            .select(Annotations.id, Annotations.name, Annotations.canBeExported)
            .where { TagAnnotationRelations.tagId eq id }
            .map { TagDetailRes.Annotation(it[Annotations.id]!!, it[Annotations.name]!!, it[Annotations.canBeExported]!!) }

        val examples = if(tag.examples.isNullOrEmpty()) emptyList() else data.db.from(Illusts)
            .innerJoin(FileRecords, FileRecords.id eq Illusts.fileId)
            .select(Illusts.id, FileRecords.id, FileRecords.folder, FileRecords.extension, FileRecords.status)
            .where { Illusts.id inList tag.examples }
            .map { IllustSimpleRes(it[Illusts.id]!!, takeThumbnailFilepath(it)) }

        val links = if(tag.links.isNullOrEmpty()) emptyList() else data.db.sequenceOf(Tags).filter { it.id inList tag.links }.map { TagDetailRes.Link(it.id, it.name, it.type, it.isGroup, it.color) }

        val parents = kit.getAllParents(tag).map { TagDetailRes.Parent(it.id, it.name, it.type, it.isGroup) }

        val mappingSourceTags = sourceMappingManager.query(MetaType.TAG, id)

        return newTagDetailRes(tag, parents, links, annotations, examples, mappingSourceTags)
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    @Deprecated("虽然写了但没有被用到的API，预计不会用到了")
    fun getIndexedInfo(id: Int): TagIndexedInfoRes {
        val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw be(NotFound())

        return if(tag.parentId != null) {
            val address = kit.getAllParents(tag)
            val parentTag = address.last()

            val member = parentTag.isGroup != Tag.IsGroup.NO
            val memberIndex = if(parentTag.isGroup == Tag.IsGroup.FORCE_AND_SEQUENCE || parentTag.isGroup == Tag.IsGroup.SEQUENCE) tag.ordinal else null

            newTagIndexedInfoRes(tag, address, member, memberIndex)
        }else{
            newTagIndexedInfoRes(tag, emptyList(), false, null)
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     * @throws RecursiveParentError parentId出现闭环
     * @throws CannotGiveColorError 不是根节点，不能修改颜色
     * @throws ResourceNotExist ("parentId", number) 给出的parent id不存在
     * @throws ResourceNotExist ("links", number[]) links中给出的tag不存在。给出不存在的link id列表
     * @throws ResourceNotExist ("examples", number[]) examples中给出的image不存在。给出不存在的image id列表
     * @throws ResourceNotExist ("annotations", number[]) 有annotation不存在时，抛出此异常。给出不存在的annotation id列表
     * @throws ResourceNotSuitable ("links", number[]) links中给出的部分资源不适用，虚拟地址段是不能被link的。给出不适用的link id列表
     * @throws ResourceNotSuitable ("examples", number[]) examples中给出的部分资源不适用，collection不能用作example。给出不适用的link id列表
     * @throws ResourceNotSuitable ("annotations", number[]) 指定target类型且有元素不满足此类型时，抛出此异常。给出不适用的annotation id列表
     * @throws ResourceNotExist ("source", string) 更新source mapping tags时给出的source不存在
     */
    fun update(id: Int, form: TagUpdateForm) {
        data.db.transaction {
            val record = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw be(NotFound())

            val newName = form.name.letOpt { kit.validateName(it) }
            val newOtherNames = form.otherNames.letOpt { kit.validateOtherNames(it) }
            val newLinks = form.links.runOpt { kit.validateLinks(this) }
            val newExamples = form.examples.runOpt { kit.validateExamples(this) }

            val (newParentId, newOrdinal) = if(form.parentId.isPresent && form.parentId.value != record.parentId) {
                //parentId发生了变化
                val newParentId = form.parentId.value

                if(newParentId != null) {
                    tailrec fun recursiveCheckParent(id: Int) {
                        if(id == record.id) {
                            //在过去经历过的parent中发现了重复的id，判定存在闭环
                            throw be(RecursiveParentError())
                        }
                        val parent = data.db.from(Tags)
                            .select(Tags.parentId)
                            .where { Tags.id eq id }
                            .limit(0, 1)
                            .map { optOf(it[Tags.parentId]) }
                            .firstOrNull()
                            //检查parent是否存在
                            ?: throw be(ResourceNotExist("parentId", newParentId))
                        val parentId = parent.value
                        if(parentId != null) recursiveCheckParent(parentId)
                    }

                    recursiveCheckParent(newParentId)
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
                Pair(undefined(), if(form.ordinal.isUndefined || form.ordinal.value == record.ordinal) undefined() else {
                    //ordinal发生了变化，为此需要确定新的ordinal、移动前后的其他tag
                    val tagsInParent = data.db.sequenceOf(Tags)
                        .filter { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } }
                        .toList()
                    val max = tagsInParent.size
                    val newOrdinal = if(form.ordinal.value > max) max else form.ordinal.value
                    if(newOrdinal > record.ordinal) {
                        //插入位置在原位置之后时，实际上会使夹在中间的项前移，为了保证插入顺位与想要的顺位保持不变，因此final ordinal位置是要-1的。
                        data.db.update(Tags) {
                            where { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greater record.ordinal) and (it.ordinal lessEq (newOrdinal - 1)) }
                            set(it.ordinal, it.ordinal - 1)
                        }
                        optOf(newOrdinal - 1)
                    }else{
                        //插入位置在原位置之前，则不需要final ordinal变更
                        data.db.update(Tags) {
                            where { if(record.parentId != null) { Tags.parentId eq record.parentId }else{ Tags.parentId.isNull() } and (it.ordinal greaterEq newOrdinal) and (it.ordinal less record.ordinal) }
                            set(it.ordinal, it.ordinal + 1)
                        }
                        optOf(newOrdinal)
                    }
                })
            }

            val newColor = if(form.color.isPresent) {
                //指定新color。此时如果parent为null，新color为指定的color，否则抛异常
                newParentId.unwrapOr { record.parentId }?.let { throw be(CannotGiveColorError()) } ?: optOf(form.color.value)
            }else{
                //没有指定新color
                if(newParentId.isPresent && newParentId.value != null) {
                    //指定的parent且不是null，此时new color为新parent的color
                    data.db.from(Tags).select(Tags.color).where { Tags.id eq newParentId.value!! }.map { optOf(it[Tags.color]!!) }.first()
                }else{
                    //color和parent都没有变化，不修改color的值
                    //指定新parent为null，策略是继承之前的颜色，因此也不修改color的值
                    undefined()
                }
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
                    if(data.db.sequenceOf(Tags).any {
                            (if(parentId != null) { Tags.parentId eq parentId }else{ Tags.parentId.isNull() } or (it.type eq Tag.Type.TAG)) and (it.name eq name) and (it.id notEq record.id)
                    }) throw be(AlreadyExists("Tag", "name", name))
                }else{
                    if(data.db.sequenceOf(Tags).any {
                            if(parentId != null) { Tags.parentId eq parentId }else{ Tags.parentId.isNull() } and (it.name eq name) and (it.id notEq record.id)
                    }) throw be(AlreadyExists("Tag", "name", name))
                }
            }

            form.annotations.letOpt { newAnnotations -> kit.processAnnotations(id, newAnnotations) }

            form.mappingSourceTags.letOpt { sourceMappingManager.update(MetaType.TAG, id, it ?: emptyList()) }

            newColor.letOpt { color ->
                fun recursionUpdateColor(parentId: Int) {
                    data.db.update(Tags) {
                        where { it.parentId eq parentId }
                        set(it.color, color)
                    }
                    data.db.from(Tags).select(Tags.id).where { Tags.parentId eq parentId }.map { it[Tags.id]!! }.forEach(::recursionUpdateColor)
                }
                recursionUpdateColor(id)
            }

            if(anyOpt(newName, newOtherNames, form.type, form.description, form.group, newLinks, newExamples, newParentId, newOrdinal, newColor)) {
                data.db.update(Tags) {
                    where { it.id eq id }

                    newName.applyOpt { set(it.name, this) }
                    newOtherNames.applyOpt { set(it.otherNames, this) }
                    form.type.applyOpt { set(it.type, this) }
                    form.description.applyOpt { set(it.description, this) }
                    form.group.applyOpt { set(it.isGroup, this) }
                    newLinks.applyOpt { set(it.links, this) }
                    newExamples.applyOpt { set(it.examples, this) }
                    newParentId.applyOpt { set(it.parentId, this) }
                    newOrdinal.applyOpt { set(it.ordinal, this) }
                    newColor.applyOpt { set(it.color, this) }
                }
            }

            if ((newLinks.isPresent && newLinks.value != record.links) ||
                (form.type.isPresent && form.type.value != record.type) ||
                (newParentId.isPresent && newParentId.value != record.parentId) ||
                form.annotations.isPresent) {
                    //发生关系类变化时，将关联的illust/album重导出
                    data.db.from(IllustTagRelations)
                        .select(IllustTagRelations.illustId)
                        .where { IllustTagRelations.tagId eq id }
                        .map { IllustMetadataExporterTask(it[IllustTagRelations.illustId]!!, exportMetaTag = true, exportDescription = false, exportFirstCover = false, exportScore = false) }
                        .let { backendExporter.add(it) }
                    data.db.from(AlbumTagRelations)
                        .select(AlbumTagRelations.albumId)
                        .where { AlbumTagRelations.tagId eq id }
                        .map { AlbumMetadataExporterTask(it[AlbumTagRelations.albumId]!!, exportMetaTag = true) }
                        .let { backendExporter.add(it) }

                    queryManager.flushCacheOf(QueryManager.CacheType.TAG)
            }

            if(newParentId.isPresent || newOrdinal.isPresent) {
                backendExporter.add(TagGlobalSortExporterTask)
            }
        }
    }

    /**
     * @throws NotFound 请求对象不存在
     */
    fun delete(id: Int) {
        fun recursionDelete(id: Int) {
            data.db.delete(Tags) { it.id eq id }
            data.db.delete(IllustTagRelations) { it.tagId eq id }
            data.db.delete(AlbumTagRelations) { it.tagId eq id }
            data.db.delete(TagAnnotationRelations) { it.tagId eq id }
            val children = data.db.from(Tags).select(Tags.id).where { Tags.parentId eq id }.map { it[Tags.id]!! }
            for (child in children) {
                recursionDelete(child)
            }
        }
        data.db.transaction {
            val tag = data.db.sequenceOf(Tags).firstOrNull { it.id eq id } ?: throw be(NotFound())
            //删除标签时，处理后面邻近记录ordinal
            data.db.update(Tags) {
                where { if(tag.parentId != null) { it.parentId eq tag.parentId }else{ it.parentId.isNull() } and (it.ordinal greater tag.ordinal) }
                set(it.ordinal, it.ordinal - 1)
            }
            //删除标签时，将关联的illust/album重导出。只需要导出当前标签的关联，而不需要导出子标签的。
            data.db.from(IllustTagRelations)
                .select(IllustTagRelations.illustId)
                .where { IllustTagRelations.tagId eq id }
                .map { IllustMetadataExporterTask(it[IllustTagRelations.illustId]!!, exportMetaTag = true, exportDescription = false, exportFirstCover = false, exportScore = false) }
                .let { backendExporter.add(it) }
            data.db.from(AlbumTagRelations)
                .select(AlbumTagRelations.albumId)
                .where { AlbumTagRelations.tagId eq id }
                .map { AlbumMetadataExporterTask(it[AlbumTagRelations.albumId]!!, exportMetaTag = true) }
                .let { backendExporter.add(it) }
            recursionDelete(id)

            queryManager.flushCacheOf(QueryManager.CacheType.TAG)
        }
    }
}