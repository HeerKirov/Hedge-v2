package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.dao.meta.Annotations
import com.heerkirov.hedge.server.dao.meta.Authors
import com.heerkirov.hedge.server.dao.meta.Tags
import com.heerkirov.hedge.server.dao.meta.Topics
import com.heerkirov.hedge.server.library.compiler.grammar.GrammarAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalAnalyzer
import com.heerkirov.hedge.server.library.compiler.lexical.LexicalOptions
import com.heerkirov.hedge.server.library.compiler.semantic.SemanticAnalyzer
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AlbumDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AnnotationDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.AuthorAndTopicDialect
import com.heerkirov.hedge.server.library.compiler.semantic.dialect.IllustDialect
import com.heerkirov.hedge.server.library.compiler.semantic.plan.*
import com.heerkirov.hedge.server.library.compiler.translator.*
import com.heerkirov.hedge.server.library.compiler.translator.visual.*
import com.heerkirov.hedge.server.library.compiler.utils.AnalysisResult
import com.heerkirov.hedge.server.library.compiler.utils.CompileError
import com.heerkirov.hedge.server.library.compiler.utils.ErrorCollector
import com.heerkirov.hedge.server.library.compiler.utils.TranslatorError
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.meta.Tag
import com.heerkirov.hedge.server.utils.ktorm.compositionContains
import com.heerkirov.hedge.server.utils.ktorm.escapeLike
import me.liuwj.ktorm.dsl.*
import me.liuwj.ktorm.entity.*
import java.util.regex.Pattern

class QueryManager(private val data: DataRepository) {
    private val queryer = MetaQueryer(data)
    private val options = OptionsImpl()

    fun querySchema(text: String, dialect: Dialect): AnalysisResult<VisualQueryPlan, CompileError<*>> {
        val lexicalResult = LexicalAnalyzer.parse(text, options)
        if(lexicalResult.result == null) {
            return AnalysisResult(null, warnings = lexicalResult.warnings, errors = lexicalResult.errors)
        }
        val grammarResult = GrammarAnalyzer.parse(lexicalResult.result)
        if(grammarResult.result == null) {
            return AnalysisResult(null, warnings = grammarResult.warnings, errors = grammarResult.errors)
        }
        val semanticResult = SemanticAnalyzer.parse(grammarResult.result, when (dialect) {
            Dialect.ILLUST -> IllustDialect::class
            Dialect.ALBUM -> AlbumDialect::class
            Dialect.AUTHOR_AND_TOPIC -> AuthorAndTopicDialect::class
            Dialect.ANNOTATION -> AnnotationDialect::class
        })
        if(semanticResult.result == null) {
            return AnalysisResult(null, warnings = semanticResult.warnings, errors = semanticResult.errors)
        }
        val translatorResult = Translator.parse(semanticResult.result, queryer, options)
        if(translatorResult.result == null) {
            return AnalysisResult(null, warnings = translatorResult.warnings, errors = translatorResult.errors)
        }

        return AnalysisResult(translatorResult.result, warnings = lexicalResult.warnings + grammarResult.warnings + semanticResult.warnings + translatorResult.warnings)
    }

    enum class Dialect { ILLUST, ALBUM, AUTHOR_AND_TOPIC, ANNOTATION }

    //TODO 将matches none的错误信息下放到这里，并且变成针对一个项的none警告，这样可以提示用户到底哪个项产生了0匹配
    private inner class QueryerImpl : Queryer {
        override fun findTag(metaValue: MetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTag> {
            fun matchAddress(tagId: Int?, address: MetaAddress, nextAddr: Int): Boolean {
                when {
                    nextAddr < 0 -> return true
                    tagId == null -> return false
                    else -> {
                        val tag = data.db.from(Tags).select(Tags.name, Tags.parentId)
                            .where { Tags.id eq tagId }
                            .map { Pair(it[Tags.name]!!, it[Tags.parentId]) }
                            .first()
                        return if ((!address[nextAddr].precise && mapMatchToJavaPattern(address[nextAddr].value).matcher(tag.first).find()) ||
                            (address[nextAddr].precise && address[nextAddr].value.equals(tag.first, ignoreCase = true))) {
                            matchAddress(tag.second, address, nextAddr - 1)
                        }else{
                            matchAddress(tag.second, address, nextAddr)
                        }
                    }
                }
            }
            //tag又增加了对序列化组的匹配模式。对tag的metaValue的解析有如下情况。
            //TODO 解析tag的real tags
            when (metaValue) {
                is SimpleMetaValue -> {
                    //普通的地址匹配
                    val address = metaValue.value
                    if(address.any { it.value.isBlank() }) {
                        collector.warning(BlankElement())
                        return emptyList()
                    }
                    return data.db.from(Tags).select()
                        .where { if(address.last().precise) Tags.name eq address.last().value else Tags.name escapeLike mapMatchToSqlLike(address.last().value) }
                        .limit(0, data.metadata.query.queryLimitOfQueryItems)
                        .map { Tags.createEntity(it) }
                        .asSequence()
                        .filter { matchAddress(it.parentId, address, address.size - 2) }
                        .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                        .toList()
                }
                is SequentialMetaValueOfCollection -> {
                    //组匹配，且使用集合选择组员
                    val address = metaValue.tag
                    if(address.any { it.value.isBlank() }) {
                        collector.warning(BlankElement())
                        return emptyList()
                    }
                    return data.db.from(Tags).select()
                        .whereWithConditions {
                            it += if(address.last().precise) Tags.name eq address.last().value else Tags.name like mapMatchToSqlLike(address.last().value)
                            //额外过滤：必须是组
                            it += (Tags.isGroup notEq Tag.IsGroup.NO)
                        }
                        .limit(0, 1)
                        .map { Tags.createEntity(it) }
                        .asSequence()
                        .filter { matchAddress(it.parentId, address, address.size - 2) }
                        .flatMap { parentTag ->
                            val result = data.db.from(Tags).select()
                                .where {
                                    (Tags.parentId eq parentTag.id) and metaValue.values.asSequence()
                                        .map { metaString -> if(metaString.precise) Tags.name eq metaString.value else Tags.name like mapMatchToSqlLike(metaString.value) }
                                        .reduce { a, b -> a or b }
                                }
                                .map { Tags.createEntity(it) }
                            result
                        }
                        .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                        .toList()
                }
                is SequentialMetaValueOfRange -> {
                    //序列化匹配，且使用区间选择组员
                    val address = metaValue.tag
                    if(address.any { it.value.isBlank() }) {
                        collector.warning(BlankElement())
                        return emptyList()
                    }
                    return data.db.from(Tags).select()
                        .whereWithConditions {
                            it += if(address.last().precise) Tags.name eq address.last().value else Tags.name like mapMatchToSqlLike(address.last().value)
                            //额外过滤：必须是序列化组
                            it += (Tags.isGroup eq Tag.IsGroup.SEQUENCE) or (Tags.isGroup eq Tag.IsGroup.FORCE_AND_SEQUENCE)
                        }
                        .limit(0, 1)
                        .map { Tags.createEntity(it) }
                        .asSequence()
                        .filter { matchAddress(it.parentId, address, address.size - 2) }
                        .flatMap { parentTag ->
                            val beginOrdinal = if(metaValue.begin == null) null else data.db.sequenceOf(Tags)
                                .filter { (it.parentId eq parentTag.id) and if(metaValue.begin.precise) it.name eq metaValue.begin.value else it.name like mapMatchToSqlLike(metaValue.begin.value) }
                                .firstOrNull()
                                ?.ordinal
                            val endOrdinal = if(metaValue.end == null) null else data.db.sequenceOf(Tags)
                                .filter { (it.parentId eq parentTag.id) and if(metaValue.end.precise) it.name eq metaValue.end.value else it.name like mapMatchToSqlLike(metaValue.end.value) }
                                .firstOrNull()
                                ?.ordinal

                            if(metaValue.begin != null && beginOrdinal == null) collector.warning(RangeElementNotFound(metaValue.begin.revertToQueryString()))
                            if(metaValue.end != null && endOrdinal == null) collector.warning(RangeElementNotFound(metaValue.end.revertToQueryString()))

                            data.db.from(Tags).select()
                                .whereWithConditions {
                                    it += Tags.parentId eq parentTag.id
                                    if(beginOrdinal != null) {
                                        it += if(metaValue.includeBegin) Tags.ordinal greaterEq beginOrdinal else Tags.ordinal greater beginOrdinal
                                    }
                                    if(endOrdinal != null) {
                                        it += if(metaValue.includeEnd) Tags.ordinal lessEq endOrdinal else Tags.ordinal less endOrdinal
                                    }
                                }
                                .orderBy(Tags.ordinal.asc())
                                .map { Tags.createEntity(it) }
                        }
                        .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                        .toList()
                }
                is SequentialItemMetaValueToOther -> {
                    //序列化匹配，且使用~选择两个组员
                    val address = metaValue.tag
                    if(address.any { it.value.isBlank() }) {
                        collector.warning(BlankElement())
                        return emptyList()
                    }
                    return data.db.from(Tags).select()
                        .where { if(address.last().precise) Tags.name eq address.last().value else Tags.name like mapMatchToSqlLike(address.last().value) }
                        .limit(0, 1)
                        .map { Tags.createEntity(it) }
                        .asSequence()
                        .filter { matchAddress(it.parentId, address, address.size - 2) }
                        .flatMap { tag ->
                            if(tag.parentId != null && data.db.sequenceOf(Tags).any { (Tags.id eq tag.parentId) and ((Tags.isGroup eq Tag.IsGroup.SEQUENCE) or (Tags.isGroup eq Tag.IsGroup.FORCE_AND_SEQUENCE)) }) {
                                val otherTag = data.db.sequenceOf(Tags).firstOrNull { (it.parentId eq tag.parentId) and if(metaValue.otherTag.precise) it.name eq metaValue.otherTag.value else it.name like mapMatchToSqlLike(metaValue.otherTag.value) }
                                if(otherTag == null) collector.warning(RangeElementNotFound(metaValue.otherTag.revertToQueryString()))

                                data.db.from(Tags).select()
                                    .whereWithConditions {
                                        it += Tags.parentId eq tag.parentId
                                        if(otherTag != null) {
                                            val thisOrdinal = tag.ordinal
                                            val otherOrdinal = otherTag.ordinal
                                            it += if(thisOrdinal >= otherOrdinal) {
                                                (Tags.ordinal greaterEq otherOrdinal) and (Tags.ordinal lessEq thisOrdinal)
                                            }else{
                                                (Tags.ordinal greaterEq thisOrdinal) and (Tags.ordinal lessEq otherOrdinal)
                                            }
                                        }
                                    }
                                    .orderBy(Tags.ordinal.asc())
                                    .map { Tags.createEntity(it) }
                            }else emptyList()
                        }
                        .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                        .toList()
                }
                is SequentialItemMetaValueToDirection -> {
                    //序列化匹配，从选择的组员开始到一个方向
                    val address = metaValue.tag
                    if(address.any { it.value.isBlank() }) {
                        collector.warning(BlankElement())
                        return emptyList()
                    }
                    return data.db.from(Tags).select()
                        .where { if(address.last().precise) Tags.name eq address.last().value else Tags.name like mapMatchToSqlLike(address.last().value) }
                        .limit(0, 1)
                        .map { Tags.createEntity(it) }
                        .asSequence()
                        .filter { matchAddress(it.parentId, address, address.size - 2) }
                        .flatMap { tag ->
                            if(tag.parentId != null && data.db.sequenceOf(Tags).any { (Tags.id eq tag.parentId) and ((Tags.isGroup eq Tag.IsGroup.SEQUENCE) or (Tags.isGroup eq Tag.IsGroup.FORCE_AND_SEQUENCE)) }) {
                                data.db.from(Tags).select()
                                    .where { (Tags.parentId eq tag.parentId) and if(metaValue.isAscending()) Tags.ordinal greaterEq tag.ordinal else Tags.ordinal lessEq tag.ordinal }
                                    .orderBy(Tags.ordinal.asc())
                                    .map { Tags.createEntity(it) }
                            }else emptyList()
                        }
                        .map { ElementTag(it.id, it.name, it.type.toString(), it.color, null) }
                        .toList()
                }
                else -> throw RuntimeException("Unsupported metaValue type ${metaValue::class.simpleName}.")
            }
        }

        override fun findTopic(metaValue: SimpleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementTopic> {
            val address = metaValue.value
            if(address.any { it.value.isBlank() }) {
                collector.warning(BlankElement())
                return emptyList()
            }
            val lastAddr = address.last()
            val topics = data.db.from(Topics).select(Topics.id, Topics.name, Topics.parentId)
                .where { if(lastAddr.precise) Topics.name eq lastAddr.value else Topics.name like mapMatchToSqlLike(lastAddr.value) }
                .limit(0, data.metadata.query.queryLimitOfQueryItems)
                .map { Triple(it[Topics.id]!!, it[Topics.name]!!, it[Topics.parentId]) }

            //对address的处理方法：
            //当address为A.B.C...M.N时，首先查找所有name match N的entity。
            //随后对于每一个entity，根据其parentId向上查找其所有父标签。当找到一个父标签满足一个地址段M时，就将要匹配的地址段向前推1(L, K, J, ..., C, B, A)。
            //如果address的每一节都被匹配，那么此entity符合条件；如果parent前推到了root依然没有匹配掉所有的address，那么不符合条件。
            //如果要缓存的话，更好的思路是递归思路，那么就转述为match(topic, address)函数表述。
            fun matchAddress(topicId: Int?, address: MetaAddress, nextAddr: Int): Boolean {
                when {
                    nextAddr < 0 -> return true
                    topicId == null -> return false
                    else -> {
                        val topic = data.db.from(Topics).select(Topics.name, Topics.parentId)
                            .where { Topics.id eq topicId }
                            .map { Pair(it[Topics.name]!!, it[Topics.parentId]) }
                            .first()
                        return if ((!address[nextAddr].precise && mapMatchToJavaPattern(address[nextAddr].value).matcher(topic.first).find()) ||
                            (address[nextAddr].precise && address[nextAddr].value.equals(topic.first, ignoreCase = true))) {
                            matchAddress(topic.second, address, nextAddr - 1)
                        }else{
                            matchAddress(topic.second, address, nextAddr)
                        }
                    }
                }
            }

            return topics.asSequence()
                .filter { (_, _, parentId) -> matchAddress(parentId, address, address.size - 2) }
                .map { (id, name, _) -> ElementTopic(id, name) }
                .toList()
        }

        override fun findAuthor(metaValue: SingleMetaValue, collector: ErrorCollector<TranslatorError<*>>): List<ElementAuthor> {
            if(metaValue.singleValue.value.isBlank()) {
                collector.warning(BlankElement())
                return emptyList()
            }
            return data.db.from(Authors).select(Authors.id, Authors.name)
                .where { if(metaValue.singleValue.precise) Authors.name eq metaValue.singleValue.value else Authors.name like mapMatchToSqlLike(metaValue.singleValue.value) }
                .limit(0, data.metadata.query.queryLimitOfQueryItems)
                .map { ElementAuthor(it[Authors.id]!!, it[Authors.name]!!) }
        }

        override fun findAnnotation(metaString: MetaString, metaType: Set<MetaType>, collector: ErrorCollector<TranslatorError<*>>): List<ElementAnnotation> {
            if(metaString.value.isBlank()) {
                collector.warning(BlankElement())
                return emptyList()
            }
            return data.db.from(Annotations).select(Annotations.id, Annotations.name)
                .whereWithConditions {
                    it += if(metaString.precise) Annotations.name eq metaString.value else Annotations.name like mapMatchToSqlLike(metaString.value)
                    if(metaType.isNotEmpty()) { it += Annotations.target compositionContains mapMetaTypeToTarget(metaType) }
                }
                .limit(0, data.metadata.query.queryLimitOfQueryItems)
                .map { ElementAnnotation(it[Annotations.id]!!, it[Annotations.name]!!) }
        }

        private fun mapMetaTypeToTarget(metaTypes: Set<MetaType>): Annotation.AnnotationTarget {
            var target: Annotation.AnnotationTarget = Annotation.AnnotationTarget.empty
            for (metaType in metaTypes) {
                when (metaType) {
                    MetaType.TAG -> target += Annotation.AnnotationTarget.TAG
                    MetaType.TOPIC -> target += Annotation.AnnotationTarget.TOPIC
                    MetaType.AUTHOR -> target += Annotation.AnnotationTarget.AUTHOR
                }
            }
            return target
        }

        private fun mapMatchToSqlLike(matchString: String): String {
            return '%' + matchString.replace(Regex("""[/"'\[\]%&_()\\]"""), """\\$0""").replace('*', '%').replace('?', '_') + '%'
        }

        private fun mapMatchToJavaPattern(matchString: String): Pattern {
            return Pattern.compile(matchString
                .replace("\\", "\\\\")
                .replace(Regex("""[$()+.\[\\^{|]"""), "\\$1")
                .replace("*", ".*")
                .replace('?', '.'),
                Pattern.CASE_INSENSITIVE)
        }
    }

    private inner class OptionsImpl : LexicalOptions, TranslatorOptions {
        private val queryOptions by lazy { data.metadata.query }

        override val translateUnderscoreToSpace: Boolean get() = queryOptions.translateUnderscoreToSpace
        override val chineseSymbolReflect: Boolean get() = queryOptions.chineseSymbolReflect
        override val warningLimitOfUnionItems: Int get() = queryOptions.warningLimitOfUnionItems
        override val warningLimitOfIntersectItems: Int get() = queryOptions.warningLimitOfIntersectItems
    }
}