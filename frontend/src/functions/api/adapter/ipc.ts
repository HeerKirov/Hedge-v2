import { Invoke, RegisterWindowEvents } from "."

export function isInClientMode(): boolean {
    return getInjectItem<boolean>("clientMode")
}

export function inject(): {invoke: Invoke, registerWindowEvents: RegisterWindowEvents} {
    return {
        invoke: getInjectItem<Invoke>("invokeIPC"),
        registerWindowEvents: getInjectItem<RegisterWindowEvents>("registerElectronEvents")
    }
}

/**从注入到window的属性中取得需要的方法。*/
function getInjectItem<T>(name: string): T | undefined {
    return window[name] as T
}