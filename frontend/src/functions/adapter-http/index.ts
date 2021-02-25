import type { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError, ResponseEmpty } from "./server"
import { createHttpInstance } from "./server"
import { createWebEndpoint, WebEndpoint } from "./impl/web"
import { createSettingWebEndpoint, SettingWebEndpoint } from "./impl/setting-web"
import { createSettingServiceEndpoint, SettingServiceEndpoint } from "@/functions/adapter-http/impl/setting-service"
import { createSettingProxyEndpoint, SettingProxyEndpoint } from "@/functions/adapter-http/impl/setting-proxy"
import { createSettingImportEndpoint, SettingImportEndpoint } from "@/functions/adapter-http/impl/setting-import"
import { createSettingSourceEndpoint, SettingSourceEndpoint } from "@/functions/adapter-http/impl/setting-source"
import { createSettingBackupEndpoint, SettingBackupEndpoint } from "@/functions/adapter-http/impl/setting-backup"

export { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError, ResponseEmpty, createHttpInstance }

export interface HttpClient {
    web: WebEndpoint
    settingWeb: SettingWebEndpoint
    settingService: SettingServiceEndpoint
    settingProxy: SettingProxyEndpoint
    settingImport: SettingImportEndpoint
    settingSource: SettingSourceEndpoint
    settingBackup: SettingBackupEndpoint
}

export function createHttpClient(http: HttpInstance): HttpClient {
    return {
        web: createWebEndpoint(http),
        settingWeb: createSettingWebEndpoint(http),
        settingService: createSettingServiceEndpoint(http),
        settingProxy: createSettingProxyEndpoint(http),
        settingImport: createSettingImportEndpoint(http),
        settingSource: createSettingSourceEndpoint(http),
        settingBackup: createSettingBackupEndpoint(http)
    }
}
