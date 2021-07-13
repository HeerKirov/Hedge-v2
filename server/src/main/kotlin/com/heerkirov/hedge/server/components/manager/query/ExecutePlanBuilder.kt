package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.dao.album.*
import com.heerkirov.hedge.server.dao.illust.*
import com.heerkirov.hedge.server.dao.meta.*
import com.heerkirov.hedge.server.dao.source.FileRecords
import com.heerkirov.hedge.server.dao.source.SourceImages
import com.heerkirov.hedge.server.dao.source.SourceTagRelations
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AlbumDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.IllustDialect
import com.heerkirov.hedge.server.library.compiler.semantic.framework.FilterFieldDefinition
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.semantic.plan.FilterValue
import com.heerkirov.hedge.server.library.compiler.translator.ExecuteBuilder
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.model.illust.Illust
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.model.source.SourceImage
import com.heerkirov.hedge.server.utils.*
import com.heerkirov.hedge.server.utils.types.*
import com.heerkirov.hedge.server.utils.ktorm.compositionAny
import com.heerkirov.hedge.server.utils.ktorm.escapeLike
import org.ktorm.database.Database
import org.ktorm.dsl.*
import org.ktorm.expression.ArgumentExpression
import org.ktorm.expression.OrderByExpression
import org.ktorm.expression.ScalarExpression
import org.ktorm.schema.BaseTable
import org.ktorm.schema.BooleanSqlType
import org.ktorm.schema.Column
import org.ktorm.schema.ColumnDeclaring
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.*
import kotlin.collections.ArrayList


interface ExecutePlanBuilder : ExecuteBuilder {
    fun build(): ExecutePlan
}

interface OrderByColumn<ORDER> : ExecuteBuilder {
    fun getOrderDeclareMapping(order: ORDER): ColumnDefinition

    fun setOrders(orders: List<OrderByExpression>)

    override fun mapOrders(orders: List<Order<*>>) {
        setOrders(orders.flatMap {
            @Suppress("UNCHECKED_CAST")
            val definition = getOrderDeclareMapping(it.value as ORDER)
            if(definition.nullsLast) {
                listOf(definition.column.isNull().desc(), if(it.isAscending()) definition.column.asc() else definition.column.desc())
            }else{
                Collections.singletonList(if(it.isAscending()) definition.column.asc() else definition.column.desc())
            }
        })
    }

    data class ColumnDefinition(val column: Column<*>, val nullsLast: Boolean = false)
}

interface FilterByColumn : ExecuteBuilder {
    fun getFilterDeclareMapping(field: FilterFieldDefinition<*>): Column<*>

    fun addWhereCondition(whereCondition: ColumnDeclaring<Boolean>)

    fun mapFilterSpecial(field: FilterFieldDefinition<*>, value: Any): Any

    fun mapCompositionFilterSpecial(field: FilterFieldDefinition<*>, column: Column<*>, values: Collection<Any>): ColumnDeclaring<Boolean> {
        throw RuntimeException("Implemented composition field ${field.key}.")
    }

    override fun mapFilter(unionItems: Collection<Filter<out FilterValue>>, exclude: Boolean) {
        if(unionItems.isNotEmpty()) {
            addWhereCondition(unionItems.map { filter ->
                val column = getFilterDeclareMapping(filter.field)
                @Suppress("UNCHECKED_CAST")
                when (filter) {
                    is EqualFilter<*> -> if (filter.values.size == 1) {
                        (column as Column<Any>) eq mapFilterSpecial(filter.field, filter.values.first().equalValue)
                    } else {
                        (column as Column<Any>) inList filter.values.map { mapFilterSpecial(filter.field, it.equalValue) }
                    }
                    is MatchFilter<*> -> filter.values.map { column escapeLike MetaParserUtil.mapMatchToSqlLike(mapFilterSpecial(filter.field, it.matchValue) as String) }.reduce { a, b -> a or b }
                    is RangeFilter<*> -> {
                        val conditions = ArrayList<ScalarExpression<Boolean>>(2)
                        if (filter.begin != null) {
                            conditions.add(if (filter.includeBegin) {
                                (column as Column<Comparable<Any>>) greaterEq mapFilterSpecial(filter.field, filter.begin.compareValue) as Comparable<Any>
                            } else {
                                (column as Column<Comparable<Any>>) greater mapFilterSpecial(filter.field, filter.begin.compareValue) as Comparable<Any>
                            })
                        }
                        if (filter.end != null) {
                            conditions.add(if (filter.includeEnd) {
                                (column as Column<Comparable<Any>>) lessEq mapFilterSpecial(filter.field, filter.end.compareValue) as Comparable<Any>
                            } else {
                                (column as Column<Comparable<Any>>) less mapFilterSpecial(filter.field, filter.end.compareValue) as Comparable<Any>
                            })
                        }
                        conditions.reduce { a, b -> a and b }
                    }
                    is CompositionFilter<*> -> mapCompositionFilterSpecial(filter.field, column, filter.values.map { it.equalValue })
                    is FlagFilter -> {
                        (column as Column<Boolean>).asExpression()
                    }
                    else -> throw RuntimeException("Unsupported filter type ${filter::class.simpleName}.")
                }
            }.reduce { a, b -> a or b }.let {
                if (exclude) it.not() else it
            })
        }
    }
}

data class ExecutePlan(val whereConditions: List<ColumnDeclaring<Boolean>>, val joinConditions: List<Join>, val orderConditions: List<OrderByExpression>, val distinct: Boolean) {
    data class Join(val table: BaseTable<*>, val condition: ColumnDeclaring<Boolean>, val left: Boolean = false)
}

class IllustExecutePlanBuilder(private val db: Database) : ExecutePlanBuilder, OrderByColumn<IllustDialect.IllustOrderItem>, FilterByColumn {
    private val orders: MutableList<OrderByExpression> = ArrayList()
    private val wheres: MutableList<ColumnDeclaring<Boolean>> = ArrayList()
    private val joins: MutableList<ExecutePlan.Join> = ArrayList()

    //在连接查询中，如果遇到一整层查询的项为空，这一层按逻辑不会产生任何结果匹配，那么相当于结果恒为空。使用这个flag来优化这种情况。
    private var alwaysFalseFlag: Boolean = false

    //根据某些条件，可能需要额外连接数据表。使用flag来存储这种情况。
    private var joinSourceImage: Boolean = false

    //在连接查询中，如果一层中有复数项，那么需要做去重。
    private var needDistinct: Boolean = false

    //在连接查询中，出现多次连接时需要alias dao，使用count做计数。
    private var joinCount = 0

    //在exclude连接查询中，具有相同类型的连接会被联合成同一个where nested查询来实现，在这里存储这个信息。
    private val excludeTags: MutableCollection<Int> = mutableSetOf()
    private val excludeTopics: MutableCollection<Int> = mutableSetOf()
    private val excludeAuthors: MutableCollection<Int> = mutableSetOf()
    private val excludeAnnotations: MutableCollection<Int> = mutableSetOf()
    private val excludeSourceTags: MutableCollection<Int> = mutableSetOf()

    private val orderDeclareMapping = mapOf(
        IllustDialect.IllustOrderItem.ID to OrderByColumn.ColumnDefinition(Illusts.id),
        IllustDialect.IllustOrderItem.SCORE to OrderByColumn.ColumnDefinition(Illusts.score, nullsLast = true),
        IllustDialect.IllustOrderItem.ORDINAL to OrderByColumn.ColumnDefinition(Illusts.orderTime),
        IllustDialect.IllustOrderItem.PARTITION to OrderByColumn.ColumnDefinition(Illusts.partitionTime),
        IllustDialect.IllustOrderItem.CREATE_TIME to OrderByColumn.ColumnDefinition(Illusts.createTime),
        IllustDialect.IllustOrderItem.UPDATE_TIME to OrderByColumn.ColumnDefinition(Illusts.updateTime),
        IllustDialect.IllustOrderItem.SOURCE_ID to OrderByColumn.ColumnDefinition(Illusts.sourceId, nullsLast = true),
        IllustDialect.IllustOrderItem.SOURCE_FROM to OrderByColumn.ColumnDefinition(SourceImages.source, nullsLast = true)
    )

    private val filterDeclareMapping = mapOf(
        IllustDialect.id to Illusts.id,
        IllustDialect.favorite to Illusts.favorite,
        IllustDialect.score to Illusts.exportedScore,
        IllustDialect.partition to Illusts.partitionTime,
        IllustDialect.ordinal to Illusts.orderTime,
        IllustDialect.createTime to Illusts.createTime,
        IllustDialect.updateTime to Illusts.updateTime,
        IllustDialect.description to Illusts.exportedDescription,
        IllustDialect.extension to FileRecords.extension,
        IllustDialect.filesize to FileRecords.size,
        IllustDialect.analyseStatus to SourceImages.analyseStatus,
        IllustDialect.sourceId to Illusts.sourceId,
        IllustDialect.sourceFrom to Illusts.source,
        IllustDialect.sourceDescription to SourceImages.description,
        IllustDialect.tagme to Illusts.tagme
    )

    override fun getOrderDeclareMapping(order: IllustDialect.IllustOrderItem): OrderByColumn.ColumnDefinition {
        return orderDeclareMapping[order]!!
    }

    override fun getFilterDeclareMapping(field: FilterFieldDefinition<*>): Column<*> {
        if(field == IllustDialect.analyseStatus || field == IllustDialect.sourceDescription) {
            joinSourceImage = true
        }
        return filterDeclareMapping[field]!!
    }

    override fun setOrders(orders: List<OrderByExpression>) {
        this.orders.addAll(orders)
    }

    override fun addWhereCondition(whereCondition: ColumnDeclaring<Boolean>) {
        wheres.add(whereCondition)
    }

    override fun mapFilterSpecial(field: FilterFieldDefinition<*>, value: Any): Any {
        return when (field) {
            IllustDialect.ordinal -> (value as LocalDate).toEpochDay() * 1000L * 60 * 60 * 24
            IllustDialect.createTime, IllustDialect.updateTime -> LocalDateTime.of(value as LocalDate, LocalTime.MIN)
            IllustDialect.analyseStatus -> when (value as IllustDialect.AnalyseStatus) {
                IllustDialect.AnalyseStatus.NO -> SourceImage.AnalyseStatus.NO
                IllustDialect.AnalyseStatus.ANALYZED -> SourceImage.AnalyseStatus.ANALYZED
                IllustDialect.AnalyseStatus.ERROR -> SourceImage.AnalyseStatus.ERROR
                IllustDialect.AnalyseStatus.MANUAL -> SourceImage.AnalyseStatus.MANUAL
                IllustDialect.AnalyseStatus.NOT_FOUND -> SourceImage.AnalyseStatus.NOT_FOUND
            }
            else -> value
        }
    }

    override fun mapCompositionFilterSpecial(field: FilterFieldDefinition<*>, column: Column<*>, values: Collection<Any>): ColumnDeclaring<Boolean> {
        return when (field) {
            IllustDialect.tagme -> {
                val tagme = if(values.isEmpty()) Illust.Tagme.baseElements.union() else values.map {
                    when (it as IllustDialect.Tagme) {
                        IllustDialect.Tagme.AUTHOR -> Illust.Tagme.AUTHOR
                        IllustDialect.Tagme.TOPIC -> Illust.Tagme.TOPIC
                        IllustDialect.Tagme.TAG -> Illust.Tagme.TAG
                        IllustDialect.Tagme.SOURCE -> Illust.Tagme.SOURCE
                    }
                }.union()
                @Suppress("UNCHECKED_CAST")
                (column as Column<Illust.Tagme>) compositionAny tagme
            }
            else -> super.mapCompositionFilterSpecial(field, column, values)
        }
    }

    override fun mapTopicElement(unionItems: List<ElementTopic>, exclude: Boolean) {
        when {
            exclude -> excludeTopics.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = IllustTopicRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.topicId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.topicId inList unionItems.map { it.id }
                }
                joins.add(ExecutePlan.Join(j, j.illustId eq Illusts.id and condition))
            }
        }
    }

    override fun mapAuthorElement(unionItems: List<ElementAuthor>, exclude: Boolean) {
        when {
            exclude -> excludeAuthors.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = IllustAuthorRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.authorId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.authorId inList unionItems.map { it.id }
                }
                joins.add(ExecutePlan.Join(j, j.illustId eq Illusts.id and condition))
            }
        }
    }

    override fun mapTagElement(unionItems: List<ElementTag>, exclude: Boolean) {
        val ids = unionItems.flatMap { if(it.tagType == Tag.Type.VIRTUAL_ADDR && it.realTags != null) it.realTags.map { t -> t.id } else listOf(it.id) }
        when {
            exclude -> excludeTags.addAll(ids)
            ids.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = IllustTagRelations.aliased("IR_${++joinCount}")
                val condition = if(ids.size == 1) {
                    j.tagId eq ids.first()
                }else{
                    needDistinct = true
                    j.tagId inList ids
                }
                joins.add(ExecutePlan.Join(j, j.illustId eq Illusts.id and condition))
            }
        }
    }

    override fun mapAnnotationElement(unionItems: List<ElementAnnotation>, exclude: Boolean, exportedFromAuthor: Boolean, exportedFromTopic: Boolean, exportedFromTag: Boolean) {
        when {
            exclude -> excludeAnnotations.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = IllustAnnotationRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.annotationId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.annotationId inList unionItems.map { it.id }
                }.letIf(exportedFromAuthor || exportedFromTopic || exportedFromTag && !(exportedFromAuthor && exportedFromTopic && exportedFromTag)) {
                    var exportedFrom: Annotation.ExportedFrom = Annotation.ExportedFrom.empty
                    if(exportedFromAuthor) exportedFrom += Annotation.ExportedFrom.AUTHOR
                    if(exportedFromTopic) exportedFrom += Annotation.ExportedFrom.TOPIC
                    if(exportedFromTag) exportedFrom += Annotation.ExportedFrom.TAG
                    it and (j.exportedFrom compositionAny exportedFrom)
                }

                joins.add(ExecutePlan.Join(j, j.illustId eq Illusts.id and condition))
            }
        }
    }

    override fun mapSourceTagElement(unionItems: List<ElementSourceTag>, exclude: Boolean) {
        when {
            exclude -> excludeSourceTags.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = SourceTagRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.tagId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.tagId inList unionItems.map { it.id }
                }
                joins.add(ExecutePlan.Join(j, j.sourceId eq Illusts.sourceImageId and condition))
            }
        }
    }

    override fun build(): ExecutePlan {
        if(alwaysFalseFlag) {
            return ExecutePlan(listOf(ArgumentExpression(false, BooleanSqlType)), emptyList(), emptyList(), false)
        }
        if(excludeTags.isNotEmpty()) {
            wheres.add(Illusts.id notInList db.from(IllustTagRelations).select(IllustTagRelations.illustId).where {
                if(excludeTags.size == 1) IllustTagRelations.tagId eq excludeTags.first() else IllustTagRelations.tagId inList excludeTags
            })
        }
        if(excludeTopics.isNotEmpty()) {
            wheres.add(Illusts.id notInList db.from(IllustTopicRelations).select(IllustTopicRelations.illustId).where {
                if(excludeTopics.size == 1) IllustTopicRelations.topicId eq excludeTopics.first() else IllustTopicRelations.topicId inList excludeTopics
            })
        }
        if(excludeAuthors.isNotEmpty()) {
            wheres.add(Illusts.id notInList db.from(IllustAuthorRelations).select(IllustAuthorRelations.illustId).where {
                if(excludeAuthors.size == 1) IllustAuthorRelations.authorId eq excludeAuthors.first() else IllustAuthorRelations.authorId inList excludeAuthors
            })
        }
        if(excludeAnnotations.isNotEmpty()) {
            wheres.add(Illusts.id notInList db.from(IllustAnnotationRelations).select(IllustAnnotationRelations.illustId).where {
                if(excludeAnnotations.size == 1) IllustAnnotationRelations.annotationId eq excludeAnnotations.first() else IllustAnnotationRelations.annotationId inList excludeAnnotations
            })
        }
        if(excludeSourceTags.isNotEmpty()) {
            wheres.add(Illusts.id notInList db.from(Illusts)
                .innerJoin(SourceTagRelations, SourceTagRelations.sourceId eq Illusts.sourceImageId)
                .select(Illusts.id))
        }
        if(joinSourceImage) {
            joins.add(ExecutePlan.Join(SourceImages, SourceImages.id eq Illusts.sourceImageId, left = true))
        }
        return ExecutePlan(wheres, joins, orders, needDistinct)
    }
}

class AlbumExecutePlanBuilder(private val db: Database) : ExecutePlanBuilder, OrderByColumn<AlbumDialect.AlbumOrderItem>, FilterByColumn {
    private val orders: MutableList<OrderByExpression> = ArrayList()
    private val wheres: MutableList<ColumnDeclaring<Boolean>> = ArrayList()
    private val joins: MutableList<ExecutePlan.Join> = ArrayList()

    //在连接查询中，如果遇到一整层查询的项为空，这一层按逻辑不会产生任何结果匹配，那么相当于结果恒为空。使用这个flag来优化这种情况。
    private var alwaysFalseFlag: Boolean = false

    //在连接查询中，如果一层中有复数项，那么需要做去重。
    private var needDistinct: Boolean = false

    //在连接查询中，出现多次连接时需要alias dao，使用count做计数。
    private var joinCount = 0

    //在exclude连接查询中，具有相同类型的连接会被联合成同一个where nested查询来实现，在这里存储这个信息。
    private val excludeTags: MutableCollection<Int> = mutableSetOf()
    private val excludeTopics: MutableCollection<Int> = mutableSetOf()
    private val excludeAuthors: MutableCollection<Int> = mutableSetOf()
    private val excludeAnnotations: MutableCollection<Int> = mutableSetOf()

    private val orderDeclareMapping = mapOf(
        AlbumDialect.AlbumOrderItem.ID to OrderByColumn.ColumnDefinition(Albums.id),
        AlbumDialect.AlbumOrderItem.SCORE to OrderByColumn.ColumnDefinition(Albums.score, nullsLast = true),
        AlbumDialect.AlbumOrderItem.IMAGE_COUNT to OrderByColumn.ColumnDefinition(Albums.cachedCount),
        AlbumDialect.AlbumOrderItem.CREATE_TIME to OrderByColumn.ColumnDefinition(Albums.createTime),
        AlbumDialect.AlbumOrderItem.UPDATE_TIME to OrderByColumn.ColumnDefinition(Albums.updateTime),
    )

    private val filterDeclareMapping = mapOf(
        AlbumDialect.id to Albums.id,
        AlbumDialect.favorite to Albums.favorite,
        AlbumDialect.score to Albums.score,
        AlbumDialect.imageCount to Albums.cachedCount,
        AlbumDialect.createTime to Albums.createTime,
        AlbumDialect.updateTime to Albums.updateTime,
        AlbumDialect.title to Albums.title,
        AlbumDialect.description to Albums.description,
    )

    override fun getOrderDeclareMapping(order: AlbumDialect.AlbumOrderItem): OrderByColumn.ColumnDefinition {
        return orderDeclareMapping[order]!!
    }

    override fun getFilterDeclareMapping(field: FilterFieldDefinition<*>): Column<*> {
        return filterDeclareMapping[field]!!
    }

    override fun setOrders(orders: List<OrderByExpression>) {
        this.orders.addAll(orders)
    }

    override fun addWhereCondition(whereCondition: ColumnDeclaring<Boolean>) {
        wheres.add(whereCondition)
    }

    override fun mapFilterSpecial(field: FilterFieldDefinition<*>, value: Any): Any {
        return when (field) {
            AlbumDialect.createTime, AlbumDialect.updateTime -> LocalDateTime.of(value as LocalDate, LocalTime.MIN)
            else -> value
        }
    }

    override fun mapTopicElement(unionItems: List<ElementTopic>, exclude: Boolean) {
        when {
            exclude -> excludeTopics.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = AlbumTopicRelations.aliased("AR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.topicId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.topicId inList unionItems.map { it.id }
                }
                joins.add(ExecutePlan.Join(j, j.albumId eq Albums.id and condition))
            }
        }
    }

    override fun mapAuthorElement(unionItems: List<ElementAuthor>, exclude: Boolean) {
        when {
            exclude -> excludeAuthors.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = AlbumAuthorRelations.aliased("AR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.authorId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.authorId inList unionItems.map { it.id }
                }
                joins.add(ExecutePlan.Join(j, j.albumId eq Albums.id and condition))
            }
        }
    }

    override fun mapTagElement(unionItems: List<ElementTag>, exclude: Boolean) {
        val ids = unionItems.flatMap { if(it.tagType == Tag.Type.VIRTUAL_ADDR && it.realTags != null) it.realTags.map { t -> t.id } else listOf(it.id) }
        when {
            exclude -> excludeTags.addAll(ids)
            ids.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = AlbumTagRelations.aliased("IR_${++joinCount}")
                val condition = if(ids.size == 1) {
                    j.tagId eq ids.first()
                }else{
                    needDistinct = true
                    j.tagId inList ids
                }
                joins.add(ExecutePlan.Join(j, j.albumId eq Albums.id and condition))
            }
        }
    }

    override fun mapAnnotationElement(unionItems: List<ElementAnnotation>, exclude: Boolean, exportedFromAuthor: Boolean, exportedFromTopic: Boolean, exportedFromTag: Boolean) {
        when {
            exclude -> excludeAnnotations.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = AlbumAnnotationRelations.aliased("AR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.annotationId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.annotationId inList unionItems.map { it.id }
                }.letIf(exportedFromAuthor || exportedFromTopic || exportedFromTag && !(exportedFromAuthor && exportedFromTopic && exportedFromTag)) {
                    var exportedFrom: Annotation.ExportedFrom = Annotation.ExportedFrom.empty
                    if(exportedFromAuthor) exportedFrom += Annotation.ExportedFrom.AUTHOR
                    if(exportedFromTopic) exportedFrom += Annotation.ExportedFrom.TOPIC
                    if(exportedFromTag) exportedFrom += Annotation.ExportedFrom.TAG
                    it and (j.exportedFrom compositionAny exportedFrom)
                }

                joins.add(ExecutePlan.Join(j, j.albumId eq Albums.id and condition))
            }
        }
    }

    override fun build(): ExecutePlan {
        if(alwaysFalseFlag) {
            return ExecutePlan(listOf(ArgumentExpression(false, BooleanSqlType)), emptyList(), emptyList(), false)
        }
        if(excludeTags.isNotEmpty()) {
            wheres.add(Albums.id notInList db.from(AlbumTagRelations).select(AlbumTagRelations.albumId).where {
                if(excludeTags.size == 1) AlbumTagRelations.tagId eq excludeTags.first() else AlbumTagRelations.tagId inList excludeTags
            })
        }
        if(excludeTopics.isNotEmpty()) {
            wheres.add(Albums.id notInList db.from(AlbumTopicRelations).select(AlbumTopicRelations.albumId).where {
                if(excludeTopics.size == 1) AlbumTopicRelations.topicId eq excludeTopics.first() else AlbumTopicRelations.topicId inList excludeTopics
            })
        }
        if(excludeAuthors.isNotEmpty()) {
            wheres.add(Albums.id notInList db.from(AlbumAuthorRelations).select(AlbumAuthorRelations.albumId).where {
                if(excludeAuthors.size == 1) AlbumAuthorRelations.authorId eq excludeAuthors.first() else AlbumAuthorRelations.authorId inList excludeAuthors
            })
        }
        if(excludeAnnotations.isNotEmpty()) {
            wheres.add(Albums.id notInList db.from(AlbumAnnotationRelations).select(AlbumAnnotationRelations.albumId).where {
                if(excludeAnnotations.size == 1) AlbumAnnotationRelations.annotationId eq excludeAnnotations.first() else AlbumAnnotationRelations.annotationId inList excludeAnnotations
            })
        }
        return ExecutePlan(wheres, joins, orders, needDistinct)
    }
}

class AuthorExecutePlanBuilder(private val db: Database) : ExecutePlanBuilder {
    private val wheres: MutableList<ColumnDeclaring<Boolean>> = ArrayList()
    private val joins: MutableList<ExecutePlan.Join> = ArrayList()

    //在连接查询中，如果遇到一整层查询的项为空，这一层按逻辑不会产生任何结果匹配，那么相当于结果恒为空。使用这个flag来优化这种情况。
    private var alwaysFalseFlag: Boolean = false

    //在连接查询中，如果一层中有复数项，那么需要做去重。
    private var needDistinct: Boolean = false

    //在连接查询中，出现多次连接时需要alias dao，使用count做计数。
    private var joinCount = 0

    //在exclude连接查询中，具有相同类型的连接会被联合成同一个where nested查询来实现，在这里存储这个信息。
    private val excludeAnnotations: MutableCollection<Int> = mutableSetOf()

    override fun mapNameElement(unionItems: List<ElementString>, exclude: Boolean) {
        wheres.add(unionItems.map {
            if(it.precise) {
                Authors.name eq it.value
            }else{
                Authors.name like MetaParserUtil.mapMatchToSqlLike(it.value)
            }
        }.reduce { a, b -> a or b }.let {
            if(exclude) it.not() else it
        })
    }

    override fun mapAnnotationElement(unionItems: List<ElementAnnotation>, exclude: Boolean, exportedFromAuthor: Boolean, exportedFromTopic: Boolean, exportedFromTag: Boolean) {
        when {
            exclude -> excludeAnnotations.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = AuthorAnnotationRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.annotationId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.annotationId inList unionItems.map { it.id }
                }

                joins.add(ExecutePlan.Join(j, j.authorId eq Authors.id and condition))
            }
        }
    }

    override fun build(): ExecutePlan {
        if(alwaysFalseFlag) {
            return ExecutePlan(listOf(ArgumentExpression(false, BooleanSqlType)), emptyList(), emptyList(), false)
        }
        if(excludeAnnotations.isNotEmpty()) {
            wheres.add(Authors.id notInList db.from(AuthorAnnotationRelations).select(AuthorAnnotationRelations.authorId).where {
                if(excludeAnnotations.size == 1) AuthorAnnotationRelations.annotationId eq excludeAnnotations.first() else AuthorAnnotationRelations.annotationId inList excludeAnnotations
            })
        }
        return ExecutePlan(wheres, joins, emptyList(), needDistinct)
    }
}

class TopicExecutePlanBuilder(private val db: Database) : ExecutePlanBuilder {
    private val wheres: MutableList<ColumnDeclaring<Boolean>> = ArrayList()
    private val joins: MutableList<ExecutePlan.Join> = ArrayList()

    //在连接查询中，如果遇到一整层查询的项为空，这一层按逻辑不会产生任何结果匹配，那么相当于结果恒为空。使用这个flag来优化这种情况。
    private var alwaysFalseFlag: Boolean = false

    //在连接查询中，如果一层中有复数项，那么需要做去重。
    private var needDistinct: Boolean = false

    //在连接查询中，出现多次连接时需要alias dao，使用count做计数。
    private var joinCount = 0

    //在exclude连接查询中，具有相同类型的连接会被联合成同一个where nested查询来实现，在这里存储这个信息。
    private val excludeAnnotations: MutableCollection<Int> = mutableSetOf()

    override fun mapNameElement(unionItems: List<ElementString>, exclude: Boolean) {
        wheres.add(unionItems.map {
            if(it.precise) {
                Topics.name eq it.value
            }else{
                Topics.name like MetaParserUtil.mapMatchToSqlLike(it.value)
            }
        }.reduce { a, b -> a or b }.let {
            if(exclude) it.not() else it
        })
    }

    override fun mapAnnotationElement(unionItems: List<ElementAnnotation>, exclude: Boolean, exportedFromAuthor: Boolean, exportedFromTopic: Boolean, exportedFromTag: Boolean) {
        when {
            exclude -> excludeAnnotations.addAll(unionItems.map { it.id })
            unionItems.isEmpty() -> alwaysFalseFlag = true
            else -> {
                val j = TopicAnnotationRelations.aliased("IR_${++joinCount}")
                val condition = if(unionItems.size == 1) {
                    j.annotationId eq unionItems.first().id
                }else{
                    needDistinct = true
                    j.annotationId inList unionItems.map { it.id }
                }

                joins.add(ExecutePlan.Join(j, j.topicId eq Topics.id and condition))
            }
        }
    }

    override fun build(): ExecutePlan {
        if(alwaysFalseFlag) {
            return ExecutePlan(listOf(ArgumentExpression(false, BooleanSqlType)), emptyList(), emptyList(), false)
        }
        if(excludeAnnotations.isNotEmpty()) {
            wheres.add(Topics.id notInList db.from(TopicAnnotationRelations).select(TopicAnnotationRelations.topicId).where {
                if(excludeAnnotations.size == 1) TopicAnnotationRelations.annotationId eq excludeAnnotations.first() else TopicAnnotationRelations.annotationId inList excludeAnnotations
            })
        }
        return ExecutePlan(wheres, joins, emptyList(), needDistinct)
    }
}

class AnnotationExecutePlanBuilder : ExecutePlanBuilder {
    private val wheres: MutableList<ColumnDeclaring<Boolean>> = ArrayList()

    override fun mapNameElement(unionItems: List<ElementString>, exclude: Boolean) {
        wheres.add(unionItems.map {
            if(it.precise) {
                Annotations.name eq it.value
            }else{
                Annotations.name like MetaParserUtil.mapMatchToSqlLike(it.value)
            }
        }.reduce { a, b -> a or b }.let {
            if(exclude) it.not() else it
        })
    }

    override fun build(): ExecutePlan {
        return ExecutePlan(wheres, emptyList(), emptyList(), false)
    }
}