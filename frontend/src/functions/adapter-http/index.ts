import type { HttpInstance, HttpInstanceConfig, Response } from "./server"
import { createHttpInstance } from "./server"
import { createWebEndpoint, WebEndpoint } from "./impl/web"
import { createSettingWebEndpoint, SettingWebEndpoint } from "./impl/setting-web"

export { HttpInstance, HttpInstanceConfig, Response, createHttpInstance }

export interface HttpClient {
    web: WebEndpoint
    settingWeb: SettingWebEndpoint
}

export function createHttpClient(http: HttpInstance): HttpClient {
    return {
        web: createWebEndpoint(http),
        settingWeb: createSettingWebEndpoint(http)
    }
}
