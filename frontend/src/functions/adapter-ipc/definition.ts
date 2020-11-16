/**
 * client ipc暴露的方法组。
 */
export interface IPCService {
    app: {
        env(): Promise<AppEnvResponse>
        status(): Promise<AppStatusResponse>
        init(form: AppInitForm): Promise<AppLoginResponse>
        login(form: AppLoginForm): Promise<AppLoginResponse>
        loginByTouchID(): Promise<AppLoginResponse>
    }
    resource: {
        server: {
            status(): Promise<ResourceStatusResponse>
            update(): Promise<void>
        }
        cli: {
            status(): Promise<ResourceStatusResponse>
            update(): Promise<void>
        }
    }
    server: {
        status(): Promise<ServerStatusResponse>
        env(): Promise<ServerEnvResponse>
        open(): Promise<ServerStatusResponse>
        close(): Promise<ServerStatusResponse>
        init(form: ServerInitForm): Promise<void>
    }
    setting: {
        auth: {
            get(): Promise<SettingAuthResponse>
            set(form: SettingAuthForm): Promise<SettingAuthResponse>
        }
        channel: {
            list(): Promise<SettingChannelListResponse>
            setDefault(form: SettingChannelForm): Promise<void>
            change(form: SettingChannelForm): Promise<void>
        }
    }
    storage: {
        get(form: StorageGetForm): Promise<any>
        set(form: StorageSetForm): Promise<void>
    }
}

//== app ==

export interface AppInitForm {
    password: string | null
}

export interface AppLoginForm {
    password: string
}

export interface AppEnvResponse {
    platform: Platform
    debugMode: boolean
    userDataPath: string
    channel: string
    canPromptTouchID: boolean
}

export interface AppStatusResponse {
    status: AppDataStatus
    isLogin: boolean
}

export interface AppLoginAccessResponse {
    needPassword: boolean
    canPromptTouchID: boolean
}

export interface AppLoginResponse {
    ok: boolean
}

//== resource ==

export interface ResourceStatusResponse {
    status: ResourceStatus
}

//== server ==

export interface ServerInitForm {
    dbPath: string
}

export interface ServerStatusResponse {
    status: ServerStatus
}

export interface ServerEnvResponse {
    pid: number
    url: string
    token: string
}

//== setting ==

export interface SettingAuthForm {

}

export interface SettingChannelForm {

}

export interface SettingAuthResponse {

}

export interface SettingChannelListResponse {
    
}

//== storage ==

export interface StorageGetForm {
    key: string
}

export interface StorageSetForm {
    key: string
    content: any
}

//== enum ==

export type Platform = "win32" | "darwin" | "linux"

export enum AppDataStatus {
    UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    LOADING = "LOADING",
    LOADED = "LOADED"
}

export enum ResourceStatus {
    UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    NEED_UPDATE = "NEED_UPDATE",
    UPDATING = "UPDATING",
    LATEST = "LATEST"
}

export enum ServerStatus {
    UNKNOWN = "UNKNOWN",
    CLOSE = "CLOSE",
    OPEN = "OPEN",
    ERROR = "ERROR",
}