import { HttpInstance, Response } from "../server"

export function createSettingSourceEndpoint(http: HttpInstance): SettingSourceEndpoint {
    return {
        site: {
            list: http.createRequest("/api/setting/source/sites"),
            create: http.createDataRequest("/api/setting/source/sites", "POST"),
            get: http.createPathRequest(name => `/api/setting/source/sites/${name}`),
            update: http.createPathDataRequest(name => `/api/setting/source/sites/${name}`, "PATCH"),
            delete: http.createPathRequest(name => `/api/setting/source/sites/${name}`, "DELETE"),
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
        get(name: string): Promise<Response<Site>>
        update(name: string, form: SiteUpdateForm): Promise<Response<unknown>>
        delete(name: string): Promise<Response<unknown>>
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
     */
    hasSecondaryId: boolean
}

export interface SiteCreateForm {
    name: string
    title: string
    /**
     * @default false
     */
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