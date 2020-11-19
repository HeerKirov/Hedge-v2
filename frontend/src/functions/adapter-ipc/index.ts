import { clientMode, createRemoteClientAdapter } from "./client"
import { createIPCService } from "./impl"
import type { RemoteClientAdapter } from "./client"
import type { IPCService } from "./definition"

export { 
    clientMode, 
    IPCService,
    RemoteClientAdapter,
    createRemoteClientAdapter, 
    createIPCService
}