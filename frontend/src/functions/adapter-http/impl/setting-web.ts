import { HttpInstance, Response } from "../server"

export interface SettingWebEndpoint {
    get(): Promise<Response<SettingWeb>>
    update(form: SettingWebUpdateForm): Promise<Response<unknown>>
}

export function createSettingWebEndpoint(http: HttpInstance): SettingWebEndpoint {
    return {
        get: http.createRequest("/setting/web"),
        update: http.createDataRequest("/setting/web", "PATCH")
    }
}

export interface SettingWeb {
    autoWebAccess: boolean
    permanent: boolean
    password: string | null
}

export interface SettingWebUpdateForm {
    autoWebAccess?: boolean
    permanent?: boolean
    password?: string | null
}