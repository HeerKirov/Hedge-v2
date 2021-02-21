import { inject, InjectionKey, provide, reactive } from "vue"
import { ApiClient, createApiClient, createHttpClient } from "@/functions/adapter-http"
import { clientMode, remote, ipc } from "@/functions/adapter-ipc"
import { AppInfoInjection, AppStateInjection, useAppStateInjection } from "./app-state"
import { FullscreenInjection, useFullscreenInjection } from "./app-fullscreen"
import { performanceTimer } from "@/utils/performance-timer"

function installAppService() {
    const timer = performanceTimer()

    const baseUrl = process.env.NODE_ENV === 'development' ? <string>process.env.VUE_APP_BASE_URL : undefined

    const httpClientConfig = reactive({baseUrl, token: undefined})
    const api = createApiClient(createHttpClient(httpClientConfig))
    const fullscreen = useFullscreenInjection(clientMode, remote)
    const { appInfo, appState } = useAppStateInjection(clientMode, ipc, api, httpClientConfig)

    timer.logTotal("install service")

    provide(AppInfoInjection, appInfo)
    provide(AppStateInjection, appState)
    provide(FullscreenInjection, fullscreen)
    provide(ApiClientInjection, api)
}

const ApiClientInjection: InjectionKey<ApiClient> = Symbol()

function useApiClient(): ApiClient {
    return inject(ApiClientInjection)!
}

export { clientMode, installAppService, useApiClient }