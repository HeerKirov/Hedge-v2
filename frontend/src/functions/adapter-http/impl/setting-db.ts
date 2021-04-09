import { HttpInstance, Response } from "../server"

export function createSettingDbEndpoint(http: HttpInstance): SettingDbEndpoint {
    return {
        get: http.createRequest("/api/setting/db")
    }
}

/**
 * 设置：数据库相关的选项。
 * @permission only client
 */
export interface SettingDbEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<DbOption>>
}

export interface DbOption {
    /**
     * 数据库所在的文件夹。
     */
    path: string
}
