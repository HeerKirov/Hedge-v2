import { App, InjectionKey } from "vue"
import { APIService, createAPIService, createHttpInstance } from "@/functions/adapter-http"
import { clientMode, getIpcService, getRemoteClient, IpcService, RemoteClientAdapter } from "@/functions/adapter-ipc"
import { AppInfoInjection, useAppInfoInjection } from "./app-info"
import { AppStateInjection, useAppStateInjection } from "./app-state"
import { FullscreenInjection, useFullscreenInjection } from "./fullscreen"

function createService() {
    const beginTime = new Date().getTime()

    const remote = getRemoteClient()
    const ipc = getIpcService()
    const httpInstance = createHttpInstance()
    const api = createAPIService(httpInstance)

    const appInfo = useAppInfoInjection(clientMode, ipc)
    const appState = useAppStateInjection(clientMode, remote, ipc, api, httpInstance, appInfo)
    const fullscreen = useFullscreenInjection(clientMode, remote)

    const endTime = new Date().getTime()
    console.log(`/install service cost = ${endTime - beginTime}ms.`)

    return {
        install(app: App) {
            app.provide(BasicComponentInjection, {clientMode, remote, ipc, api})
            app.provide(AppInfoInjection, appInfo)
            app.provide(AppStateInjection, appState)
            app.provide(FullscreenInjection, fullscreen)
        }
    }
}

interface BasicComponent {
    clientMode: boolean, 
    remote: RemoteClientAdapter, 
    ipc: IpcService,
    api: APIService
}

const BasicComponentInjection: InjectionKey<BasicComponent> = Symbol()

export { createService, BasicComponentInjection, clientMode }