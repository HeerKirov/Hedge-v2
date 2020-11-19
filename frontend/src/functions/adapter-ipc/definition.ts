/**
 * client ipc暴露的方法组。
 */
export interface IPCService {
    app: {
        env(): AppEnvResponse
        status(): AppStatusResponse
        init(form: AppInitForm): Promise<AppLoginResponse>
        login(form: AppLoginForm): Promise<AppLoginResponse>
        loginByTouchID(): Promise<AppLoginResponse>
    }
    resource: {
        server: {
            status(): ResourceStatusResponse
            update(): Promise<void>
        }
        cli: {
            status(): ResourceStatusResponse
            update(): Promise<void>
        }
    }
    server: {
        status(): ServerStatusResponse
        env(): Promise<ServerEnvResponse>
        open(): Promise<ServerStatusResponse>
        close(): Promise<ServerStatusResponse>
        init(form: ServerInitForm): Promise<void>
    }
    setting: {
        auth: {
            get(): SettingAuthResponse
            set(form: SettingAuthForm): Promise<SettingAuthResponse>
        }
        channel: {
            list(): Promise<SettingChannelListResponse>
            setDefault(form: SettingChannelForm): Promise<void>
            change(form: SettingChannelForm): void
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
    password?: string | null
    touchID?: boolean
}

export interface SettingChannelForm {
    channel: string
}

export interface SettingAuthResponse {
    password: string | null
    touchID: boolean
}

export interface SettingChannelListResponse {
    channels: string[]
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

export type Platform = "win32" | "darwin" | "linux" | "web"

//前端的enum移除了unknown的定义，是因为在前端之前这些状态必定已经初始化完成。

export enum AppDataStatus {
    //UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    LOADING = "LOADING",
    LOADED = "LOADED"
}

export enum ResourceStatus {
    //UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    NEED_UPDATE = "NEED_UPDATE",
    UPDATING = "UPDATING",
    LATEST = "LATEST"
}

export enum ServerStatus {
    //UNKNOWN = "UNKNOWN",
    CLOSE = "CLOSE",
    OPEN = "OPEN"
}