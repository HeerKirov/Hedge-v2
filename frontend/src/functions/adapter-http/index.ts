import type { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError, ResponseEmpty } from "./server"
import { createHttpInstance } from "./server"
import { createWebEndpoint, WebEndpoint } from "./impl/web"
import { createSettingWebEndpoint, SettingWebEndpoint } from "./impl/setting-web"
import { createSettingServiceEndpoint, SettingServiceEndpoint } from "@/functions/adapter-http/impl/setting-service"

export { HttpInstance, HttpInstanceConfig, Response, ResponseOk, ResponseError, ResponseConnectionError, ResponseEmpty, createHttpInstance }

export interface HttpClient {
    web: WebEndpoint
    settingWeb: SettingWebEndpoint
    settingService: SettingServiceEndpoint
}

export function createHttpClient(http: HttpInstance): HttpClient {
    return {
        web: createWebEndpoint(http),
        settingWeb: createSettingWebEndpoint(http),
        settingService: createSettingServiceEndpoint(http)
    }
}
