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

export interface ServerEnvResponse extends ServerConnectionInfo {}

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
