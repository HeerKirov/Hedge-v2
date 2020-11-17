import { InjectionKey, provide } from "vue"
import { APIService, createAPIService } from "@/functions/adapter-http"
import { clientMode, createIPCService, createRemoteClientAdapter, IPCService, RemoteClientAdapter } from "@/functions/adapter-ipc"

export function useStateService() {
    const remote = createRemoteClientAdapter()
    const ipc = createIPCService()
    const api = createAPIService()

    provide(BasicComponentInjection, {clientMode, remote, ipc, api})
}

export const BasicComponentInjection: InjectionKey<{clientMode: boolean, remote: RemoteClientAdapter, ipc: IPCService, api: APIService}> = Symbol()