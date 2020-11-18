import { InjectionKey, provide } from "vue"
import { APIService, createAPIService } from "@/functions/adapter-http"
import { clientMode, createIPCService, createRemoteClientAdapter, IPCService, RemoteClientAdapter } from "@/functions/adapter-ipc"
import { provideAppInfo } from "./app-info"

/**
 * 构造，并provide所有service的composition api需要的数据。
 */
export function provideService() {
    const remote = createRemoteClientAdapter()
    const ipc = createIPCService()
    const api = createAPIService()

    provide(BasicComponentInjection, {clientMode, remote, ipc, api})
    provideAppInfo()
}

export const BasicComponentInjection: InjectionKey<BasicComponent> = Symbol()

interface BasicComponent {
    clientMode: boolean, 
    remote: RemoteClientAdapter, 
    ipc: IPCService, 
    api: APIService
}