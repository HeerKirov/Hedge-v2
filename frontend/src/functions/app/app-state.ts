import { inject, InjectionKey, readonly, ref, Ref } from "vue"
import { AppEnv, ClientPlatform, IpcService, State } from "@/functions/adapter-ipc/ipc"
import { HttpClient, HttpInstanceConfig } from "@/functions/adapter-http"
import { getOSName, OSName } from "@/utils/process"
import { useLocalStorage } from "./app-storage"


/**
 * 使用app平台的基础数据，提供平台相关的环境数据。这些数据恒定不变。
 */
export function useAppInfo(): Readonly<AppInfo> {
    return inject(appInfoInjection)!
}

/**
 * 提供app基础状态管理。基础状态指app的初始化状态和登录状态。对于web，只有登录状态。
 * */
export function useAppState(): AppState {
    return inject(appStateInjection)!
}

export interface AppState {
    /**
     * App的状态。null表示状态还未初始化，这只会发生在web端。
     * */
    state: Readonly<Ref<State | null>>
    /**
     * 在未登录的情况下，验证密码，并将登录状态设置为已登录。
     * */
    login(password: string): Promise<boolean>
    /**
     * 在未登录的情况下，验证touchID，并将登录状态设置为已登录。
     * */
    loginByTouchID(): Promise<boolean>
}

export type AppInfo = AppInfoInClient | AppInfoInWeb

export interface AppInfoInClient {
    clientMode: true
    platform: ClientPlatform
    channel: string
    userDataPath: string
    debugMode: boolean
    canPromptTouchID: boolean
}

export interface AppInfoInWeb {
    clientMode: false
    platform: OSName
    debugMode: false
    canPromptTouchID: false
}

export const appInfoInjection: InjectionKey<Readonly<AppInfo>> = Symbol()
export const appStateInjection: InjectionKey<AppState> = Symbol()


export function useAppStateInjection(clientMode: boolean, ipc: IpcService, api: HttpClient, httpClientConfig: HttpInstanceConfig) {
    if(clientMode) {
        const env = ipc.app.env()
        const appInfo = getAppInfoInClient(env)
        const appState = useAppStateInClientMode(ipc, env, httpClientConfig)

        return {appInfo, appState}
    }else{
        const appInfo = getAppInfoInWeb()
        const appState = useAppStateInWebMode(api, httpClientConfig)

        return {appInfo, appState}
    }
}

function useAppStateInClientMode(ipc: IpcService, appEnv: AppEnv, httpClientConfig: HttpInstanceConfig): AppState {
    const canPromptTouchID = appEnv.canPromptTouchID

    const state: Ref<State> = ref(appEnv.appState)

    if(appEnv.connection != null) {
        httpClientConfig.baseUrl = appEnv.connection.url
        httpClientConfig.token = appEnv.connection.token
    }

    ipc.app.stateChangedEvent.addEventListener(newState => {
        if(newState === State.LOADED) {
            const connectionInfo = ipc.app.env().connection
            if(connectionInfo != null) {
                httpClientConfig.baseUrl = connectionInfo.url
                httpClientConfig.token = connectionInfo.token
            }
        }
        state.value = newState
    })

    const login = async (password: string) => {
        const res = await ipc.app.login(password)
        if(res.ok) {
            //根据异步模型，login返回时同时返回立即更改的state
            if(state.value == State.NOT_LOGIN) {
                state.value = res.state!
            }
            return true
        }
        return false
    }
    const loginByTouchID = async () => {
        if(canPromptTouchID) {
            const res = await ipc.app.loginByTouchID()
            if(res.ok) {
                if(state.value == State.NOT_LOGIN) {
                    state.value = res.state!
                }
                return true
            }
        }
        return false
    }

    return {
        state: readonly(state),
        login,
        loginByTouchID
    }
}

function useAppStateInWebMode(api: HttpClient, httpClientConfig: HttpInstanceConfig): AppState {
    const ls = useLocalStorage<{token: string}>("web-access", {clientMode: false, canPromptTouchID: false, debugMode: false, platform: getOSName()})

    const state: Ref<State | null> = ref(null)

    const login = async (password: string) => {
        const res = await api.web.login({password})
        if(res.ok) {
            httpClientConfig.token = res.data.token
            ls.value = {token: res.data.token}
            state.value = State.LOADED
            return true
        }else if(res.exception && res.exception.code === "PASSWORD_WRONG") {
            return false
        }else{
            return false
        }
    }

    async function load() {
        const webAccess = await api.web.access()
        if(!webAccess.ok) {
            if(webAccess.exception) {
                console.error(`Error ${webAccess.exception.status} ${webAccess.exception.code}: ${webAccess.exception.message}`)
            }else{
                console.error("Web server connection error.")
            }
            return
        }else if(!webAccess.data.access) {
            console.error("Web access is disabled.")
            return
        }else if(!webAccess.data.needPassword) {
            state.value = State.LOADED
            return
        }
        if(ls.value != null) {
            const verify = await api.web.verifyToken({token: ls.value.token})
            if(!verify.ok) {
                console.error(verify.exception?.message)
                return
            }else if(verify.data.ok) {
                httpClientConfig.token = ls.value.token
                state.value = State.LOADED
            }else{
                ls.value = null
            }
        }
        state.value = State.NOT_LOGIN
    }

    load().catch(console.error)

    return {
        state: readonly(state),
        async loginByTouchID() { return false },
        login
    }
}

function getAppInfoInClient(env: AppEnv): AppInfo {
    return {
        clientMode: true,
        platform: env.platform,
        channel: env.channel,
        userDataPath: env.userDataPath,
        debugMode: env.debugMode,
        canPromptTouchID: env.canPromptTouchID
    }
}

function getAppInfoInWeb(): AppInfo {
    return {
        clientMode: false,
        platform: getOSName(),
        debugMode: false,
        canPromptTouchID: false
    }
}
