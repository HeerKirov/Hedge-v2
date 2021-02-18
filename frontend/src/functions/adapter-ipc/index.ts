import { clientMode, createRemoteClientAdapter } from "./client"
import { createIpcService } from "./impl"
import type { RemoteClientAdapter, OpenDialogOptions, MenuTemplate } from "./client"
import type { IpcService, NativeTheme } from "./definition"

export { 
    clientMode, 
    IpcService,
    RemoteClientAdapter,
    OpenDialogOptions,
    NativeTheme,
    MenuTemplate
}

let remoteClient: RemoteClientAdapter|undefined = undefined
let ipcService: IpcService|undefined = undefined

export function getRemoteClient(): RemoteClientAdapter {
    return remoteClient || (remoteClient = createRemoteClientAdapter())
}

export function getIpcService(): IpcService {
    return ipcService || (ipcService = createIpcService())
}