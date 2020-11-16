import { ipcInvoke } from "./client"
import { IPCService } from "./definition"

const invoke = <T, R>(channel: string) => (form?: T): Promise<R> => ipcInvoke(channel, form)

export function createIPCService(): IPCService {
    return {
        app: {
            env: invoke("/app/env"),
            status: invoke("/app/status"),
            init: invoke("/app/init"),
            login: invoke("/app/login"),
            loginByTouchID: invoke("/app/login-by-touch-id")
        },
        resource: {
            server: {
                status: invoke("/resource/server/status"),
                update: invoke("/resource/server/update")
            },
            cli: {
                status: invoke("/resource/cli/status"),
                update: invoke("/resource/cli/update")
            }
        },
        server: {
            status: invoke("/server/status"),
            env: invoke("/server/env"),
            open: invoke("/server/open"),
            close: invoke("/server/close"),
            init: invoke("/server/init"),
        },
        setting: {
            auth: {
                get: invoke("/setting/auth/get"),
                set: invoke("/setting/auth/set")
            },
            channel: {
                list: invoke("/setting/channel/list"),
                setDefault: invoke("/setting/channel/set-default"),
                change: invoke("/setting/channel/change")
            }
        },
        storage: {
            get: invoke("/storage/get"),
            set: invoke("/storage/set")
        }
    }
}