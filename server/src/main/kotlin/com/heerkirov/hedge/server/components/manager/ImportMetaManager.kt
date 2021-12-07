package com.heerkirov.hedge.server.components.manager

import com.heerkirov.hedge.server.components.database.DataRepository
import com.heerkirov.hedge.server.components.database.ImportOption
import com.heerkirov.hedge.server.exceptions.InvalidOptionError
import com.heerkirov.hedge.server.exceptions.InvalidRegexError
import com.heerkirov.hedge.server.exceptions.be
import java.util.concurrent.ConcurrentHashMap
import java.util.regex.Pattern

class ImportMetaManager(private val data: DataRepository) {
    /**
     * 对一条import记录的内容进行解析，得到source元数据。
     * @throws InvalidRegexError (regex) 执行正则表达式时发生错误，怀疑是表达式或相关参数没写对
     * @throws InvalidOptionError ("import.systemDownloadHistoryPath") 试图使用系统下载数据库，但没有配置数据库路径
     */
    fun analyseSourceMeta(filename: String?, fromSource: List<String>?): Triple<String?, Long?, Int?> {
        for (rule in data.metadata.import.sourceAnalyseRules) {
            when(rule) {
                is ImportOption.SourceAnalyseRuleByName -> analyseSourceMetaByName(rule, filename)
                is ImportOption.SourceAnalyseRuleByFromMeta -> analyseSourceMetaByFromMeta(rule, fromSource)
                else -> throw UnsupportedOperationException("Unsupported rule ${rule::class.simpleName}.")
            }?.let { (id, secondaryId) ->
                return Triple(rule.site, id, secondaryId)
            }
        }

        return Triple(null, null, null)
    }

    /**
     * @throws InvalidRegexError (regex) 执行正则表达式时发生错误，怀疑是表达式或相关参数没写对
     */
    private fun analyseSourceMetaByName(rule: ImportOption.SourceAnalyseRuleByName, filename: String?): Pair<Long, Int?>? {
        if(filename == null) return null
        val text = getFilenameWithoutExtension(filename)
        val pattern = patterns.computeIfAbsent(rule.regex) { Pattern.compile(it) }

        val matcher = pattern.matcher(text)
        if(!matcher.find()) return null
        try {
            val id = rule.idIndex.let { matcher.group(it) }.toLong()
            val secondaryId = rule.secondaryIdIndex?.let { matcher.group(it) }?.toInt()
            return Pair(id, secondaryId)
        }catch(e: IndexOutOfBoundsException) {
            throw be(InvalidRegexError(rule.regex, "Specified index of id/secondaryId is out of bounds of matches."))
        }catch(e: NumberFormatException) {
            throw be(InvalidRegexError(rule.regex, "Value of id/secondaryId cannot be convert to number."))
        }catch(e: Exception) {
            throw be(InvalidRegexError(rule.regex, e.message ?: e::class.simpleName ?: "Unnamed exception."))
        }
    }

    /**
     * @throws InvalidRegexError (regex) 执行正则表达式时发生错误，怀疑是表达式或相关参数没写对
     */
    private fun analyseSourceMetaByFromMeta(rule: ImportOption.SourceAnalyseRuleByFromMeta, fromSource: List<String>?): Pair<Long, Int?>? {
        if(fromSource.isNullOrEmpty()) return null
        val pattern = patterns.computeIfAbsent(rule.regex) { Pattern.compile(it) }

        for(from in fromSource) {
            val matcher = pattern.matcher(from)
            if(matcher.find()) {
                try {
                    val id = rule.idIndex.let { matcher.group(it) }.toLong()
                    val secondaryId = rule.secondaryIdIndex?.let { matcher.group(it) }?.toInt()
                    return Pair(id, secondaryId)
                }catch(e: IndexOutOfBoundsException) {
                    throw be(InvalidRegexError(rule.regex, "Specified index of id/secondaryId is out of bounds of matches."))
                }catch(e: NumberFormatException) {
                    throw be(InvalidRegexError(rule.regex, "Value of id/secondaryId cannot be convert to number."))
                }catch(e: Exception) {
                    throw be(InvalidRegexError(rule.regex, e.message ?: e::class.simpleName ?: "Unnamed exception."))
                }
            }
        }
        return null
    }

    private fun getFilenameWithoutExtension(filename: String): String {
        val i = filename.lastIndexOf('.')
        return if(i >= 0) filename.substring(0, i) else filename
    }

    private val patterns = ConcurrentHashMap<String, Pattern>()
}