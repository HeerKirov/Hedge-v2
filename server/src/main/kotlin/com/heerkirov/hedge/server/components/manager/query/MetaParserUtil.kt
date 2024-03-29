package com.heerkirov.hedge.server.components.manager.query

import com.heerkirov.hedge.server.dao.source.SourceTags
import com.heerkirov.hedge.server.dao.types.MetaTag
import com.heerkirov.hedge.server.library.compiler.semantic.plan.MetaString
import com.heerkirov.hedge.server.library.compiler.semantic.plan.MetaType
import com.heerkirov.hedge.server.model.meta.Annotation
import com.heerkirov.hedge.server.model.source.SourceTag
import com.heerkirov.hedge.server.utils.ktorm.escapeLike
import org.ktorm.dsl.eq
import org.ktorm.dsl.or
import org.ktorm.expression.BinaryExpression
import java.util.concurrent.ConcurrentHashMap

internal object MetaParserUtil {
    /**
     * 将metaString的值编译为对指定种类metaTag的等价或比较操作。
     */
    fun compileNameString(metaString: MetaString, metaTag: MetaTag<*>): BinaryExpression<Boolean> {
        return if(metaString.precise) {
            metaTag.name eq metaString.value
        }else{
            val value = mapMatchToSqlLike(metaString.value)
            (metaTag.name escapeLike value) or (metaTag.otherNames escapeLike value)
        }
    }

    /**
     * 将metaString的值编译为对指定种类metaTag的等价或比较操作。
     */
    fun compileNameString(metaString: MetaString, metaTag: SourceTags): BinaryExpression<Boolean> {
        return if(metaString.precise) {
            metaTag.name eq metaString.value
        }else{
            val value = mapMatchToSqlLike(metaString.value)
            (metaTag.name escapeLike value) or (metaTag.displayName escapeLike value)
        }
    }

    /**
     * 根据metaString的类型，判断它是否能匹配目标缓存项。
     */
    fun isNameEqualOrMatch(metaString: MetaString, item: MetaQueryer.ItemInterface): Boolean {
        return if(metaString.precise) {
            metaString.value.equals(item.name, ignoreCase = true)
        }else{
            val regex = mapMatchToRegexPattern(metaString.value)
            regex.containsMatchIn(item.name) || item.otherNames.any { regex.containsMatchIn(it) }
        }
    }

    /**
     * 将语义中的metaType转换至annotation模型层中的target定义。
     */
    fun mapMetaTypeToTarget(metaTypes: Set<MetaType>): Annotation.AnnotationTarget {
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

    /**
     * 将HQL的match字符串翻译至符合sql like标准的格式，并转义需要防备的字符。
     */
    fun mapMatchToSqlLike(matchString: String): String {
        return sqlLikeMap.computeIfAbsent(matchString) {
            escapeSqlLike(escapeSqlSpecial(it))
        }
    }

    /**
     * 执行sql like转义，将具有特殊意义的符号转义掉。
     */
    fun escapeSqlSpecial(string: String): String {
        return string.replace(sqlLikeReplaceRegex, """\\$0""")
    }

    /**
     * 执行sql like转义，将HQL中的查询符号转义到sql like。
     */
    fun escapeSqlLike(string: String): String {
        return '%' + string.replace('*', '%').replace('?', '_') + '%'
    }

    /**
     * 将HQL的match字符串翻译至正则表达式标准格式，并转义需要防备的字符。
     */
    private fun mapMatchToRegexPattern(matchString: String): Regex {
        return regexPatternMap.computeIfAbsent(matchString) {
            val pattern = it
                .replace("\\", "\\\\")
                .replace(regexPatternReplaceRegex, "\\$0")
                .replace("*", ".*")
                .replace('?', '.')
            Regex(pattern, RegexOption.IGNORE_CASE)
        }
    }

    /**
     * 串联列表。
     */
    fun <T> unionList(vararg list: List<T>): List<T> {
        val result = ArrayList<T>(list.sumOf { it.size })
        for (i in list) {
            result.addAll(i)
        }
        return result
    }

    private val sqlLikeMap = ConcurrentHashMap<String, String>()
    private val regexPatternMap = ConcurrentHashMap<String, Regex>()

    private val sqlLikeReplaceRegex = Regex("""[/"'\[\]%&_()\\]""")
    private val regexPatternReplaceRegex = Regex("""[$()+.\[\\^{|]""")
}