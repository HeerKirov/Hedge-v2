import { inject, InjectionKey, readonly, ref, Ref } from "vue"
import { AppDataStatus, IpcService } from "../adapter-ipc/definition"
import { APIService, HttpInstance } from "../adapter-http"
import { RemoteClientAdapter } from "../adapter-ipc"
import { AppInfo } from "./app-info"
import { useLocalStorage } from "./storage"

export function useAppStateInjection(clientMode: boolean, remote: RemoteClientAdapter, ipc: IpcService, api: APIService, httpInstance: HttpInstance, appInfo: AppInfo): AppState {
    return clientMode 
        ? useAppStateInClientMode(ipc, remote, appInfo)
        : useAppStateInWebMode(api, httpInstance, appInfo)
}

function useAppStateInClientMode(ipc: IpcService, remote: RemoteClientAdapter, appInfo: AppInfo): AppState {
    const ipcStatus = ipc.app.status()

    const canPromptTouchID: boolean = appInfo.canPromptTouchID && ipcStatus.status == AppDataStatus.LOADED && ipc.setting.auth.get().touchID
    const status: Ref<AppStateStatus> = ref(ipcStatus.status == AppDataStatus.NOT_INIT ? "NOT_INIT" : ipcStatus.isLogin ? "LOGIN" : "NOT_LOGIN")

    const initializeApp = async (password: string | null) => {
        const res = await ipc.app.init({password})
        if(res.ok) {
            status.value = "LOGIN"
            return true
        }
        await remote.dialog.showMessage({ type: "error", title: "Error", message: res.errorMessage! })
        return false
    }
    const login = async (password: string) => {
        const res = await ipc.app.login({password})
        if(res.ok) {
            status.value = "LOGIN"
            return true
        }
        return false
    }
    const loginByTouchID = async () => {
        if(!canPromptTouchID) return false
        const res = await ipc.app.loginByTouchID()
        if(res.ok) {
            status.value = "LOGIN"
            return true
        }
        return false
    }

    return {
        status: readonly(status),
        canPromptTouchID,
        initializeApp,
        login,
        loginByTouchID
    }
}

function useAppStateInWebMode(api: APIService, httpInstance: HttpInstance, appInfo: AppInfo): AppState {
    const ls = useLocalStorage<{token: string}>("web-access", appInfo)

    const status: Ref<AppStateStatus> = ref("UNKNOWN")

    const login = async (password: string) => {
        const res = await api.web.login({password})
        if(res.ok) {
            httpInstance.setToken(res.data.token)
            ls.value = {token: res.data.token}
            return true
        }else if(res.status && res.code === "PASSWORD_WRONG") {
            return false
        }else{
            console.error(res.message)
            return false
        }
    }

    async function loadStatus() {
        const webAccess = await api.web.access()
        if(!webAccess.ok) {
            if(webAccess.status) {
                console.error(`Error ${webAccess.status}: ${console.error(webAccess.message)}`)
            }else{
                console.error("Web server connection error.")
            }
            return
        }else if(!webAccess.data.access) {
            console.error("Web access is disabled.")
            return
        }else if(!webAccess.data.needPassword) {
            status.value = "LOGIN"
            return
        }
        if(ls.value != null) {
            const verify = await api.web.tokenVerify({token: ls.value.token})
            if(!verify.ok) {
                console.error(verify.message)
                return
            }else if(verify.data.ok) {
                httpInstance.setToken(ls.value.token)
                status.value = "LOGIN"
            }else{
                ls.value = null
            }
        }
        status.value = "NOT_LOGIN"
    }

    loadStatus().catch(console.error)

    return {
        status: readonly(status),
        canPromptTouchID: false,
        async initializeApp() { return true },
        async loginByTouchID() { return false },
        login
    }
}

/** 提供app基础状态管理。基础状态指app的初始化状态和登录状态。对于web，只有登录状态。 */
export function useAppState(): AppState {
    return inject(AppStateInjection)!
}

export interface AppState {
    /** App的状态，包括未初始化、未登录和已登录。此外当状态未完全加载时，值是unknown。 */
    status: Readonly<Ref<AppStateStatus>>
    /** 检查是否应该使用touchID登录。它综合了touchID启用标记和偏好设置给出最终结果。
     *  可以发现它是个固定值，不会更新，因为没有setting变更的通知，不过这不影响它的使用场景。
     *  为什么不会影响？因为检查是否需要登录的时刻总是新建页面并跳转到login的时刻。在这之前，必不可能存在对设置项的更改。
     * */
    canPromptTouchID: boolean
    /** 初始化AppData。 */
    initializeApp(password: string | null): Promise<boolean>
    /** 在未登录的情况下，验证密码，并将登录状态设置为已登录。 */
    login(password: string): Promise<boolean>
    /** 在未登录的情况下，验证touchID，并将登录状态设置为已登录。 */
    loginByTouchID(): Promise<boolean>
}

export type AppStateStatus = "NOT_INIT" | "NOT_LOGIN" | "LOGIN" | "UNKNOWN"

export const AppStateInjection: InjectionKey<AppState> = Symbol()