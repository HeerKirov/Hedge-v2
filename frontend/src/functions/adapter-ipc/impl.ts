import { ipcInvoke, ipcInvokeSync } from "./client"
import { IPCService } from "./definition"

const invoke = <T, R>(channel: string) => (form?: T): Promise<R> => ipcInvoke(channel, form)
const invokeSync = <T, R>(channel: string) => (form?: T): R => ipcInvokeSync(channel, form)

export function createIPCService(): IPCService {
    return {
        app: {
            env: invokeSync("/app/env"),
            status: invokeSync("/app/status"),
            init: invoke("/app/init"),
            login: invoke("/app/login"),
            loginByTouchID: invoke("/app/login-by-touch-id")
        },
        resource: {
            server: {
                status: invokeSync("/resource/server/status"),
                update: invoke("/resource/server/update")
            },
            cli: {
                status: invokeSync("/resource/cli/status"),
                update: invoke("/resource/cli/update")
            }
        },
        server: {
            status: invokeSync("/server/status"),
            env: invoke("/server/env"),
            open: invoke("/server/open"),
            close: invoke("/server/close"),
            init: invoke("/server/init"),
        },
        setting: {
            auth: {
                get: invokeSync("/setting/auth/get"),
                set: invoke("/setting/auth/set")
            },
            channel: {
                list: invoke("/setting/channel/list"),
                setDefault: invoke("/setting/channel/set-default"),
                change: invokeSync("/setting/channel/change")
            }
        },
    }
}