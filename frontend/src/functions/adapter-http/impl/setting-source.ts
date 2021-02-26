import { HttpInstance, Response } from "../server"

export function createSettingSourceEndpoint(http: HttpInstance): SettingSourceEndpoint {
    return {
        site: {
            list: http.createRequest("/api/setting/source/sites"),
            create: http.createDataRequest("/api/setting/source/sites", "POST"),
            get: http.createPathRequest(name => `/api/setting/source/sites/${name}`),
            update: http.createPathDataRequest(name => `/api/setting/source/sites/${name}`, "PATCH"),
            delete: http.createPathRequest(name => `/api/setting/source/sites/${name}`, "DELETE"),
        },
        spider: {
            getUsableRules: http.createRequest("/api/setting/source/spider/usable-rules"),
            get: http.createRequest("/api/setting/source/spider"),
            update: http.createDataRequest("/api/setting/source/spider", "PATCH")
        }
    }
}

/**
 * 设置：原始数据相关的选项。
 * @permission only client
 */
export interface SettingSourceEndpoint {
    /**
     * 来源网站列表。
     */
    site: {
        /**
         * 查看列表。
         */
        list(): Promise<Response<Site[]>>
        /**
         * 新增一个来源网站。
         * @exception ALREADY_EXISTS
         */
        create(form: SiteCreateForm): Promise<Response<unknown>>
        /**
         * 查看单个项。
         * @exception NOT_FOUND 此项不存在。
         */
        get(name: string): Promise<Response<Site>>
        /**
         * 更改项。
         * @exception NOT_FOUND 此项不存在。
         */
        update(name: string, form: SiteUpdateForm): Promise<Response<unknown>>
        /**
         * 删除项。
         * @exception NOT_FOUND 此项不存在。
         * @exception CASCADE_RESOURCE_EXISTS(Illust|ImportImage|SourceAnalyseRule|SpiderRule) 存在级联资源，无法删除。
         */
        delete(name: string): Promise<Response<unknown>>
    }
    /**
     * 爬虫选项。
     */
    spider: {
        /**
         * 查询系统中可用的spider rule的列表。
         */
        getUsableRules(): Promise<Response<string[]>>
        /**
         * 查看。
         */
        get(): Promise<Response<SpiderOption>>
        /**
         * 更改。
         * @exception NOT_EXIST(rules.site|rules.name|siteRules.site, {value}) 指定的site name或rule name不存在时报告此错误。
         */
        update(form: SpiderOptionUpdateForm): Promise<Response<unknown>>
    }
}

export interface Site {
    /**
     * 网站的识别名称。
     */
    name: string
    /**
     * 网站的显示名称。
     */
    title: string
    /**
     * 此网站是否拥有secondary id。
     * @default false
     */
    hasSecondaryId: boolean
}

export interface SiteCreateForm {
    name: string
    title: string
    hasSecondaryId?: boolean
    /**
     * 在列表中的排序顺序，从0开始。
     * @default 追加到末尾
     */
    ordinal?: number
}

export interface SiteUpdateForm {
    title?: string
    ordinal?: number
}

export interface SpiderOption {
    /**
     * 算法配对规则。site -> ruleName。
     */
    rules: {[site: string]: string}
    /**
     * 全局的爬虫规则。
     */
    publicRule: SpiderRule
    /**
     * 对每一个site单独指定的爬虫规则。
     */
    siteRules: {[site: string]: SpiderRule}
}

export interface SpiderOptionUpdateForm {
    rules: {[site: string]: string}
    publicRule: SpiderRule
    siteRules: {[site: string]: SpiderRule}
}

interface SpiderRule {
    /**
     * 使用代理。默认不使用。
     */
    useProxy: boolean | null
    /**
     * 在失败指定的次数后，移除代理并尝试直连。设为-1表示总是使用代理。全局默认值-1。
     */
    disableProxyAfterTimes: number | null
    /**
     * 单次请求多久未响应视作超时，单位毫秒。全局默认值15000。
     */
    timeout: number | null
    /**
     * 失败重试次数。默认值3。
     */
    retryCount: number | null
    /**
     * 在完成一个项目后等待多长时间，防止因频率过高引起的封禁。单位毫秒。全局默认值8000。
     */
    tryInterval: number | null
}