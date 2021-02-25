import { HttpInstance, Response } from "../server"

export function createSettingImportEndpoint(http: HttpInstance): SettingImportEndpoint {
    return {
        get: http.createRequest("/api/setting/import"),
        update: http.createDataRequest("/api/setting/import", "PATCH")
    }
}

/**
 * 设置：导入相关选项。
 * @permission only client
 */
export interface SettingImportEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<SettingImport>>
    /**
     * 更改。
     */
    update(form: SettingImportUpdateForm): Promise<Response<unknown>>
}

export interface SettingImport {
    /**
     * 导入时，自动从文件分析source信息。
     */
    autoAnalyseMeta: boolean
    /**
     * 导入时，自动设定meta tag的tagme。
     */
    setTagmeOfTag: boolean
    /**
     * 导入时，根据情况自动设定source的tagme。
     */
    setTagmeOfSource: boolean
    /**
     * 导入时，使用哪种属性设置create time。
     */
    setTimeBy: TimeType
    /**
     * 分区的延后时间，单位毫秒。null等同0。
     */
    setPartitionTimeDelay: number | null
    /**
     * source分析的规则列表。
     */
    sourceAnalyseRules: SourceAnalyseRule[]
    /**
     * 指定系统的下载历史数据库位置。null表示不设定。
     */
    systemDownloadHistoryPath: string | null
}

export interface SettingImportUpdateForm {
    autoAnalyseMeta?: boolean
    setTagmeOfTag?: boolean
    setTagmeOfSource?: boolean
    setTimeBy?: TimeType
    setPartitionTimeDelay?: number | null
    sourceAnalyseRules?: SourceAnalyseRule[]
    systemDownloadHistoryPath?: string | null
}

/**
 * 用来设定create time的时间属性。
 */
export type TimeType = "IMPORT_TIME" | "CREATE_TIME" | "UPDATE_TIME"

/**
 * 一条source解析规则。
 */
export type SourceAnalyseRule = SourceAnalyseRuleByName | SourceAnalyseRuleByFromMeta | SourceAnalyseRuleBySystemHistory

/**
 * 根据文件名解析的规则。
 */
interface SourceAnalyseRuleByName {
    type: "name"
    site: string
    regex: string
    idIndex: number
    secondaryIdIndex: number | null
}

/**
 * 从meta元数据解析的规则。
 */
interface SourceAnalyseRuleByFromMeta {
    type: "from-meta"
    site: string
    regex: string
    idIndex: number
    secondaryIdIndex: number | null
}

/**
 * 从系统下载数据库解析的规则。
 */
interface SourceAnalyseRuleBySystemHistory {
    type: "system-history"
    site: string
    pattern: string
    regex: string
    idIndex: number
    secondaryIdIndex: number | null
}