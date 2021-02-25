import { HttpInstance, Response } from "../server"

export function createSettingServiceEndpoint(http: HttpInstance): SettingServiceEndpoint {
    return {
        get: http.createRequest("/api/setting/service"),
        update: http.createDataRequest("/api/setting/service", "PATCH")
    }
}

/**
 * 设置：后台服务本身相关的选项。
 * @permission only client
 */
export interface SettingServiceEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<SettingService>>
    /**
     * 更改。
     */
    update(form: SettingService): Promise<Response<unknown>>
}

export interface SettingService {
    /**
     * 后台服务建议使用的端口。
     * null表示没有建议，由它自己选择端口。
     * 使用整数+逗号(,)+横线(-)表示建议的范围。
     * 这个参数没有强制检查，如果写错，则在检测时不生效。
     */
    port: string | null
}
