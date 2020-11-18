import { InjectionKey, provide } from "vue"
import { APIService, createAPIService, createHttpInstance } from "@/functions/adapter-http"
import { clientMode, createIPCService, createRemoteClientAdapter, IPCService, RemoteClientAdapter } from "@/functions/adapter-ipc"
import { provideAppInfo } from "./app-info"
import { provideAppState } from "./app-state"

/**
 * 构造，并provide所有service的composition api需要的数据。
 */
export function provideService() {
    const remote = createRemoteClientAdapter()
    const ipc = createIPCService()
    const httpInstance = createHttpInstance()
    const api = createAPIService(httpInstance)

    provide(BasicComponentInjection, {clientMode, remote, ipc, api})
    provideAppInfo(clientMode, ipc)
    provideAppState(clientMode, ipc, api, httpInstance)
}

export const BasicComponentInjection: InjectionKey<BasicComponent> = Symbol()

interface BasicComponent {
    clientMode: boolean, 
    remote: RemoteClientAdapter, 
    ipc: IPCService, 
    api: APIService
}