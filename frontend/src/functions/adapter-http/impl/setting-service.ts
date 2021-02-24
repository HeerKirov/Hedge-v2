import { HttpInstance, Response } from "../server"

export interface SettingServiceEndpoint {
    get(): Promise<Response<SettingService>>
    update(form: SettingService): Promise<Response<unknown>>
}

export function createSettingServiceEndpoint(http: HttpInstance): SettingServiceEndpoint {
    return {
        get: http.createRequest("/api/setting/service"),
        update: http.createDataRequest("/api/setting/service", "PATCH")
    }
}

export interface SettingService {
    port: string | null
}
