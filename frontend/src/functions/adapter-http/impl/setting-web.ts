import { HttpInstance, Response } from "../server"

export function createSettingWebEndpoint(http: HttpInstance): SettingWebEndpoint {
    return {
        get: http.createRequest("/api/setting/web"),
        update: http.createDataRequest("/api/setting/web", "PATCH")
    }
}

/**
 * 设置：web访问相关选项。
 * @permission only client
 */
export interface SettingWebEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<SettingWeb>>
    /**
     * 更改。
     */
    update(form: SettingWebUpdateForm): Promise<Response<unknown>>
}

export interface SettingWeb {
    /**
     * 自动开启web访问。
     */
    autoWebAccess: boolean
    /**
     * web访问开启后，使server在后台持续运行。
     */
    permanent: boolean
    /**
     * web访问的密码。null表示无需密码。
     */
    password: string | null
    /**
     * web访问的控制开关。
     */
    access: boolean
}

export interface SettingWebUpdateForm {
    autoWebAccess?: boolean
    permanent?: boolean
    password?: string | null
    access?: boolean
}