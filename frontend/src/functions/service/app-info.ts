import { inject, InjectionKey, readonly } from "vue"
import { IPCService, Platform } from "../adapter-ipc/definition"

export function useAppInfoInjection(clientMode: boolean, ipc: IPCService): AppInfo {
    if(clientMode) {
        const env = ipc.app.env()
        return readonly({...env, clientMode: true})
    }else{
        return readonly({
            clientMode: false,
            platform: "web",
            debugMode: false,
            userDataPath: "",
            channel: "",
            canPromptTouchID: false
        })
    }
}

/**
 * 使用app平台的基础数据，提供平台相关的环境数据。这些数据恒定不变。
 */
export function useAppInfo(): Readonly<AppInfo> {
    return inject(AppInfoInjection)!
}

export interface AppInfo {
    clientMode: boolean
    platform: Platform
    debugMode: boolean
    userDataPath: string
    channel: string
    canPromptTouchID: boolean
}

export const AppInfoInjection: InjectionKey<Readonly<AppInfo>> = Symbol()
