import { inject, readonly, ref, Ref } from "vue"
import { ServerStatus } from "../adapter-ipc/definition"
import { BasicComponentInjection } from './install'

/** 提供对server的连接管理的控制接入。 */
export function useAppServer(): AppServer {
    const { clientMode, ipc, remote } = inject(BasicComponentInjection)!

    if(!clientMode) {
        return {
            status: readonly(ref(true)),
            connect() { throw new Error("Cannot call IPC in web.") },
            disconnect() { throw new Error("Cannot call IPC in web.") },
            initializeDatabase() { throw new Error("Cannot call IPC in web.") }
        }
    }

    const status = ref(ipc.server.status().status === ServerStatus.OPEN)

    const connect = async () => {
        const res = await ipc.server.open()
        status.value = res.ok
        if(!res.ok) {
            await remote.dialog.showMessage({ type: "error", title: "Error", message: res.errorMessage! })
            return false
        }
        return true
    }
    
    const disconnect = async () => {
        const res = await ipc.server.close()
        status.value = res.ok
        if(!res.ok) {
            await remote.dialog.showMessage({ type: "error", title: "Error", message: res.errorMessage! })
        }
    }

    const initializeDatabase = async (dbPath: string) => {
        const res = await ipc.server.init({dbPath})
        if(!res.ok) {
            await remote.dialog.showMessage({ type: "error", title: "Error", message: res.errorMessage! })
            return false
        }
        return true
    }

    return {
        status: readonly(status),
        connect,
        disconnect,
        initializeDatabase
    }
}

export interface AppServer {
    status: Readonly<Ref<boolean>>
    connect(): Promise<boolean>
    disconnect(): Promise<void>
    initializeDatabase(dbPath: string): Promise<boolean>
}