import { inject, InjectionKey, readonly } from "vue"
import { ClientPlatform, IPCService } from "../adapter-ipc/definition"

export function useAppInfoInjection(clientMode: boolean, ipc: IPCService): AppInfo {
    if(clientMode) {
        const env = ipc.app.env()
        return readonly({...env, clientMode: true})
    }else{
        return readonly({
            clientMode: false,
            platform: "web",
            debugMode: false,
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

export type AppInfo = AppInfoInClient|AppInfoInWeb

export interface AppInfoInClient {
    clientMode: true
    platform: ClientPlatform
    debugMode: boolean
    userDataPath: string
    channel: string
    canPromptTouchID: boolean
}

export interface AppInfoInWeb {
    clientMode: false
    platform: "web"
    debugMode: boolean
    canPromptTouchID: false
}

export const AppInfoInjection: InjectionKey<Readonly<AppInfo>> = Symbol()
