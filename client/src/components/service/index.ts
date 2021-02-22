import { ServerConnectionInfo } from "../server/model"
import { ResourceStatus } from "../resource"
import { InitConfig, State, InitState } from "../state"
import { NativeTheme } from "../appdata/model"
import { Platform } from "../../utils/process"

export { createService } from "./impl"

/**
 * 控制面板模式。面向外部控制器(ipc-transformer)，将底层模块提供的功能整合成服务，同时内部还负责管理app的应用状态，例如登录状态。
 * 此组件的方法都是endpoint方法。
 */
export interface Service {
    app: {
        env(): AppEnv
        init(form: InitConfig): Promise<void>
        login(password: string): Promise<boolean>
        loginByTouchID(): Promise<boolean>
        onStateChanged(event: (state: State) => void): void
        onInitStateChanged(event: (state: InitState) => void): void
    }
    window: {
        openNewWindow(form?: NewWindowOptions): Promise<void>
        openSetting(): Promise<void>
        openGuide(): Promise<void>
    }
    cli: {
        status(): Promise<ResourceStatus>
        update(): Promise<ActionResult>
    }
    appearance: {
        get(): Promise<AppearanceSetting>
        set(value: AppearanceSetting): Promise<void>
    }
    auth: {
        get(): Promise<AuthSetting>
        set(value: AuthSetting): Promise<void>
    }
    channel: {
        list(): Promise<string[]>
        getDefault(): Promise<string>
        setDefault(channel: string): Promise<void>
        change(channel: string): void
    }
}

//== app ==

export interface AppEnv {
    platform: Platform
    debugMode: boolean
    userDataPath: string
    channel: string
    canPromptTouchID: boolean
    appState: State
    connection: ServerConnectionInfo | null
}

//== appearance ==

export interface AppearanceSetting {
    theme: NativeTheme
}

//== auth ==

export interface AuthSetting {
    password: string | null
    touchID: boolean
    fastboot: boolean
}

//== window ==

export interface NewWindowOptions {
    routeName?: string
    routeParam?: string
}

//== action ==

export interface ActionResult {
    ok: boolean
    errorCode?: string
    errorMessage?: string
}