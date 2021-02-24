import { HttpInstance, Response } from "../server"

export interface SettingWebEndpoint {
    get(): Promise<Response<SettingWeb>>
    update(form: SettingWebUpdateForm): Promise<Response<unknown>>
}

export function createSettingWebEndpoint(http: HttpInstance): SettingWebEndpoint {
    return {
        get: http.createRequest("/api/setting/web"),
        update: http.createDataRequest("/api/setting/web", "PATCH")
    }
}

export interface SettingWeb {
    autoWebAccess: boolean
    permanent: boolean
    password: string | null
    access: boolean
}

export interface SettingWebUpdateForm {
    autoWebAccess?: boolean
    permanent?: boolean
    password?: string | null
    access?: boolean
}