import { clientMode, createRemoteClientAdapter } from "./client"
import { createIpcService } from "./impl"
import type { RemoteClientAdapter } from "./client"
import type { IpcService } from "./definition"

export { 
    clientMode, 
    IpcService,
    RemoteClientAdapter
}

let remoteClient: RemoteClientAdapter|undefined = undefined
let ipcService: IpcService|undefined = undefined

export function getRemoteClient(): RemoteClientAdapter {
    return remoteClient || (remoteClient = createRemoteClientAdapter())
}

export function getIpcService(): IpcService {
    return ipcService || (ipcService = createIpcService())
}