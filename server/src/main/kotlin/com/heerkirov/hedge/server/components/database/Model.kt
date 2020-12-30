package com.heerkirov.hedge.server.components.database

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

data class Metadata(
    val source: SourceOption,
    val import: ImportOption,
    val spider: SpiderOption
)

/**
 * 与原始数据相关的选项。
 */
data class SourceOption(
    /**
     * 注册在系统中的原始数据的site列表。此列表与SourceImage的source列值关联。
     */
    val sites: MutableList<Site>
) {
    data class Site(val name: String, var title: String, val hasId: Boolean, val hasSecondaryId: Boolean)
}

/**
 * 与导入相关的选项。
 */
data class ImportOption(
    /**
     * 在文件导入时，自动执行对source元数据的分析操作。
     */
    var autoAnalyseMeta: Boolean,
    /**
     * 导入的新文件的tagme属性的默认值。这里的值是enum的name的列表。
     */
    var setTagme: List<String>,
    /**
     * 导入的新文件的createTime属性从什么属性派生。给出的可选项是几类文件的物理属性。
     * 其中有的属性是有可能不存在的。如果选用了这些不存在的属性，那么会去选用必定存在的属性，即IMPORT_TIME。
     */
    var setCreateTimeBy: TimeType,
    /**
     * 默认的分区时间从createTime截取。但是此属性将影响日期的范围，使延后一定时间的时间范围仍然算作昨天。单位ms。
     */
    var setPartitionTimeDelay: Long?,
    /**
     * 解析来源时，使用的规则列表。
     */
    var sourceAnalyseRules: List<SourceAnalyseRule>,
    /**
     * 指定系统的下载历史数据库的位置路径。
     */
    var systemDownloadHistoryPath: String?,
) {
    enum class TimeType {
        IMPORT_TIME,
        CREATE_TIME,
        UPDATE_TIME
    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
    @JsonSubTypes(value = [
        JsonSubTypes.Type(value = SourceAnalyseRuleByName::class, name = "name"),
        JsonSubTypes.Type(value = SourceAnalyseRuleByFromMeta::class, name = "from-meta"),
        JsonSubTypes.Type(value = SourceAnalyseRuleBySystemHistory::class, name = "system-history")
    ])
    interface SourceAnalyseRule { val site: String }

    interface SourceAnalyseRuleOfRegex : SourceAnalyseRule {
        val regex: String
        val idIndex: Int?
        val secondaryIdIndex: Int?
    }

    /**
     * 规则类型name：通过正则解析文件名来分析。
     * @param regex 使用此正则表达式匹配文件名来分析id。
     */
    class SourceAnalyseRuleByName(override val site: String, override val regex: String, override val idIndex: Int?, override val secondaryIdIndex: Int?) : SourceAnalyseRuleOfRegex

    /**
     * 规则类型from-meta：通过正则解析来源信息来分析。仅对macOS有效。
     * macOS通常会在下载的文件中附加元信息，标记文件的下载来源URL。可以解析这个URL来获得需要的来源信息。
     * @param regex 使用此正则表达式匹配并分析下载来源URL，分析id。
     */
    class SourceAnalyseRuleByFromMeta(override val site: String, override val regex: String, override val idIndex: Int?, override val secondaryIdIndex: Int?) : SourceAnalyseRuleOfRegex

    /**
     * 规则类型system-history：通过查阅系统下载历史数据库来分析。仅对macOS有效。
     * 这是一个用法比较狭隘的分析法。macOS有一个记载下载历史的数据库，如果已经丢失了文件的所有可供分析的元信息但仍保留文件名，那么可以尝试通过查询下载历史得到下载来源。
     * 也不是所有的下载历史查询都能得到正确的下载来源，但至少是最后的保留手段。
     * @param pattern 在{LSQuarantineDataURLString}列中，使用此正则表达式匹配文件名。
     * @param regex 在{LSQuarantineOriginURLString}列中，使用此正则表达式匹配并分析id。
     */
    class SourceAnalyseRuleBySystemHistory(override val site: String, val pattern: String, override val regex: String, override val idIndex: Int?, override val secondaryIdIndex: Int?) : SourceAnalyseRuleOfRegex
}

/**
 * 与爬虫相关的选项。
 */
class SpiderOption(
    /**
     * 爬虫算法的配对规则。key:value=siteName:爬虫算法名称。爬虫算法名称在系统中写死。
     */
    var rules: Map<String, String>,
    /**
     * 全局的爬虫规则。
     */
    var publicRule: SpiderRule,
    /**
     * 针对每种不同的site单独设置的爬虫规则。这些规则可空，空时从全局取默认值。
     */
    var siteRules: Map<String, SpiderRule>
) {
    class SpiderRule(
        /**
         * 开启使用代理。全局默认值为不开启。
         */
        val useProxy: Boolean? = null,
        /**
         * 在失败指定的次数后，移除代理并尝试直连。设为-1表示总是使用代理。全局默认值-1。
         */
        val disableProxyAfterTimes: Int? = null,
        /**
         * 单次请求多久未响应视作超时，单位毫秒。全局默认值15000。
         */
        val timeout: Long? = null,
        /**
         * 失败重试的次数。全局默认值3。
         */
        val retryCount: Int? = null,
        /**
         * 在完成一个项目后等待多长时间，防止因频率过高引起的封禁。单位毫秒。全局默认值8000。
         */
        val tryInterval: Long? = null
    )
}