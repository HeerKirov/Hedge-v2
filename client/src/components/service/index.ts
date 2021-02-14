import { ServerConnectionInfo, ServerStatus } from "../server/model"
import { ResourceStatus } from "../resource"
import { AppDataStatus } from "../appdata"
import { Platform } from "../../utils/process"

export { createService } from "./impl"

/**
 * 控制面板模式。面向外部控制器(ipc-transformer)，将底层模块提供的功能整合成服务，同时内部还负责管理app的应用状态，例如登录状态。
 * 此组件的方法都是endpoint方法。
 */
export interface Service {
    app: {
        env(): AppEnvResponse
        status(): AppStatusResponse
        init(form: AppInitForm): Promise<ActionResponse>
        login(form: AppLoginForm): Promise<AppLoginResponse>
        loginByTouchID(): Promise<AppLoginResponse>
    }
    resource: {
        server: {
            status(): ResourceStatusResponse
            update(): Promise<ActionResponse>
        }
        cli: {
            status(): ResourceStatusResponse
            update(): Promise<ActionResponse>
        }
    }
    server: {
        status(): ServerStatusResponse
        env(): Promise<ServerEnvResponse>
        open(): Promise<ActionResponse>
        close(): Promise<ActionResponse>
        init(form: ServerInitForm): Promise<ActionResponse>
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

export interface ServerEnvResponse extends ServerConnectionInfo {}

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

//== action ==

export interface ActionResponse {
    ok: boolean
    errorCode?: string
    errorMessage?: string
}