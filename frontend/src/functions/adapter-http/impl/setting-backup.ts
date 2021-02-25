import { HttpInstance, Response } from "../server"

export function createSettingBackupEndpoint(http: HttpInstance): SettingBackupEndpoint {
    return {
        get: http.createRequest("/api/setting/backup", "GET", {
            parseResponse(data: any): SettingBackup {
                return {
                    path: data.path,
                    autoBackup: data.autoBackup,
                    lastUpdate: data.lastUpdate != null ? new Date(<number>data.lastUpdate) : null
                }
            }
        }),
        update: http.createDataRequest("/api/setting/backup", "PATCH")
    }
}

/**
 * 设置：备份相关选项。
 * @permission only client
 */
export interface SettingBackupEndpoint {
    /**
     * 查看。
     */
    get(): Promise<Response<SettingBackup>>
    /**
     * 更改。
     * @param form
     */
    update(form: SettingBackupUpdateForm): Promise<Response<unknown>>
}

export interface SettingBackup {
    /**
     * 备份的目标路径。null表示没有开启备份。
     */
    path: string | null
    /**
     * 上次备份的时间。
     */
    lastUpdate: Date | null
    /**
     * 是否允许自动备份。
     */
    autoBackup: boolean
}

export interface SettingBackupUpdateForm {
    path?: string | null
    autoBackup?: boolean
}