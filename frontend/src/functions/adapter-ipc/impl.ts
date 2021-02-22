import { ipcInvoke, ipcInvokeSync, ipcOn } from "./client"
import { IpcService } from "./ipc"
import { createEmitter, Emitter } from "@/utils/emitter"

const invoke = <T, R>(channel: string) => (form?: T): Promise<R> => ipcInvoke(channel, form)
const invokeSync = <T, R>(channel: string) => (form?: T): R => ipcInvokeSync(channel, form)
const on = <T>(channel: string): Emitter<T> => {
    const emitter = createEmitter<T>()
    ipcOn(channel, emitter.emit)
    return emitter
}

function createIpcService(): IpcService {
    return {
        app: {
            env: invokeSync("/app/env"),
            init: invoke("/app/init"),
            login: invoke("/app/login"),
            loginByTouchID: invoke("/app/login-by-touch-id"),
            stateChangedEvent: on("/app/state/changed"),
            initChangedEvent: on("/app/init/changed")
        },
        window: {
            openNewWindow: invoke("/window/new-window"),
            openSetting: invoke("/window/open-setting"),
            openGuide: invoke("/window/open-guide")
        },
        cli: {
            status: invoke("/cli/status"),
            update: invoke("/cli/update")
        },
        appearance: {
            get: invoke("/appearance/get"),
            set: invoke("/appearance/set")
        },
        auth: {
            get: invoke("/auth/get"),
            set: invoke("/auth/set")
        },
        channel: {
            list: invoke("/channel/list"),
            getDefault: invoke("/channel/get-default"),
            setDefault: invoke("/channel/set-default"),
            change: invokeSync("/channel/change")
        }
    }
}

export const ipc: IpcService = createIpcService()