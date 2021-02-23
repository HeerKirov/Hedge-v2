import { inject, InjectionKey, provide, reactive } from "vue"
import { HttpClient, createHttpClient, createHttpInstance } from "@/functions/adapter-http"
import { clientMode, remote, ipc } from "@/functions/adapter-ipc"
import { AppInfoInjection, AppStateInjection, useAppStateInjection } from "./app-state"
import { FullscreenInjection, useFullscreenInjection } from "./app-fullscreen"
import { performanceTimer } from "@/utils/performance-timer"

function installAppService() {
    const timer = performanceTimer()

    const baseUrl = process.env.NODE_ENV === 'development' ? <string>process.env.VUE_APP_BASE_URL : undefined

    const httpClientConfig = reactive({baseUrl, token: undefined})
    const api = createHttpClient(createHttpInstance(httpClientConfig))
    const fullscreen = useFullscreenInjection(clientMode, remote)
    const { appInfo, appState } = useAppStateInjection(clientMode, ipc, api, httpClientConfig)

    timer.logTotal("install service")

    provide(AppInfoInjection, appInfo)
    provide(AppStateInjection, appState)
    provide(FullscreenInjection, fullscreen)
    provide(HttpClientInjection, api)
}

const HttpClientInjection: InjectionKey<HttpClient> = Symbol()

function useHttpClient(): HttpClient {
    return inject(HttpClientInjection)!
}

export { clientMode, installAppService, useHttpClient }