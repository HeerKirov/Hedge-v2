import { HttpInstance, Response } from "../server"

export function createSettingMetaEndpoint(http: HttpInstance): SettingMetaEndpoint {
    return {
        get: http.createRequest("/api/setting/meta"),
        update: http.createDataRequest("/api/setting/meta", "PATCH")
    }
}

/**
 * 设置：基本元数据相关的选项。
 * @permission only client
 */
export interface SettingMetaEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<MetaOption>>
    /**
     * 更改。
     */
    update(form: MetaOptionUpdateForm): Promise<Response<unknown>>
}

export interface MetaOption {
    /**
     * score的最大可取值(最小可取值固定为1)。
     * @range [1, 100]
     */
    scoreMaximum: number
    /**
     * score的描述。descriptions[i]代表了score = i + 1的描述
     */
    scoreDescriptions: string[]
    /**
     * 对相关元数据做更改后自动清除对应的tagme标记。
     */
    autoCleanTagme: boolean
}

export interface MetaOptionUpdateForm {
    scoreMaximum?: number
    scoreDescriptions?: string[]
    autoCleanTagme?: boolean
}