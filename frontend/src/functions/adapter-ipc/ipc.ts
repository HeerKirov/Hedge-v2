import { Emitter } from "@/utils/emitter"

/**
 * client ipc暴露的方法组。
 */
export interface IpcService {
    app: {
        env(): AppEnv
        init(form: InitConfig): Promise<void>
        login(password: string): Promise<boolean>
        loginByTouchID(): Promise<boolean>
        stateChangedEvent: Emitter<State>
        initChangedEvent: Emitter<InitState>
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
        setDefault(channel: string): Promise<void>
        change(channel: string): void
    }
}

//== app ==

export interface AppEnv {
    platform: ClientPlatform
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

//== model ==

export type ClientPlatform = "win32" | "darwin" | "linux"
export type NativeTheme = "system" | "light" | "dark"

//前端的enum移除了unknown的定义，是因为在前端之前这些状态必定已经初始化完成。

export enum State {
    NOT_INIT = "NOT_INIT",  //(稳定态)app未初始化
    LOADING = "LOADING",                    //(瞬间态)加载中，还不知道要做什么
    LOADING_RESOURCE = "LOADING_RESOURCE",  //加载中，正在处理资源升级
    LOADING_SERVER = "LOADING_SERVER",      //加载中，正在处理核心服务连接
    NOT_LOGIN = "NOT_LOGIN",    //(稳定态)app已加载完成，但是需要登录
    LOADED = "LOADED"           //(稳定态)app已加载完成，且不需要登录，是已经可用了的状态
}

export enum InitState {
    INITIALIZING = "INITIALIZING",
    INITIALIZING_APPDATA = "INITIALIZING_APPDATA",
    INITIALIZING_RESOURCE = "INITIALIZING_RESOURCE",
    INITIALIZING_SERVER = "INITIALIZING_SERVER",
    INITIALIZING_SERVER_DATABASE = "INITIALIZING_SERVER_DATABASE",
    FINISH = "FINISH",
    ERROR = "ERROR"
}

export enum ResourceStatus {
    //UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    NEED_UPDATE = "NEED_UPDATE",
    UPDATING = "UPDATING",
    LATEST = "LATEST"
}

export interface InitConfig {
    password: string | null
    dbPath: string
}

export interface ServerConnectionInfo {
    pid: number
    url: string
    token: string
}