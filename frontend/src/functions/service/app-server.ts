import { inject, readonly, ref, Ref } from "vue"
import { ServerStatus } from "../adapter-ipc/definition"
import { BasicComponentInjection } from './install'

/** 提供对server的连接管理的控制接入。 */
export function useAppServer(): AppServer {
    const { clientMode, ipc } = inject(BasicComponentInjection)!

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
        status.value = res.status === ServerStatus.OPEN
    }
    
    const disconnect = async () => {
        const res = await ipc.server.close()
        status.value = res.status === ServerStatus.OPEN
    }

    const initializeDatabase = async (dbPath: string) => {
        await ipc.server.init({dbPath})
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
    connect(): Promise<void>
    disconnect(): Promise<void>
    initializeDatabase(dbPath: string): Promise<void>
}