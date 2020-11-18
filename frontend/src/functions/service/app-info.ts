import { inject, InjectionKey, provide, readonly } from "vue"
import { Platform } from "../adapter-ipc/definition"
import { BasicComponentInjection } from "./install"

export function provideAppInfo() {
    const { clientMode, ipc } = inject(BasicComponentInjection)!

    const env = ipc.app.env()

    provide(AppInfoInjection, readonly({...env, clientMode}))
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

const AppInfoInjection: InjectionKey<Readonly<AppInfo>> = Symbol()
