import { provide, reactive } from "vue"
import { HttpClient, HttpInstanceConfig, createHttpClient, createHttpInstance } from "@/functions/adapter-http"
import { clientMode, remote, ipc } from "@/functions/adapter-ipc"
import { performanceTimer } from "@/utils/performance-timer"
import { appInfoInjection, appStateInjection, useAppStateInjection, AppInfo, AppState } from "./app-state"
import { httpClientInjection, useHttpClient } from "./app-http"
import { fullscreenInjection, useFullscreenInjection } from "./app-fullscreen"
import { useErrorHandler } from "./error-handler"

interface AppServiceOptions {
    handleError(title: string, message: string)
}

function installAppService(options: AppServiceOptions): {appInfo: AppInfo, appState: AppState, httpClient: HttpClient} {
    const timer = performanceTimer()

    const baseUrl = process.env.NODE_ENV === 'development' ? <string>process.env.VUE_APP_BASE_URL : undefined

    const { processHttpClientError: handleError } = useErrorHandler(options.handleError)
    const httpClientConfig = reactive<HttpInstanceConfig>({
        baseUrl,
        token: undefined,
        handleError
    })
    const httpClient = createHttpClient(createHttpInstance(httpClientConfig))
    const { appInfo, appState } = useAppStateInjection(clientMode, ipc, httpClient, httpClientConfig)
    const fullscreen = useFullscreenInjection(clientMode, remote)

    timer.logTotal("install service")

    provide(appInfoInjection, appInfo)
    provide(appStateInjection, appState)
    provide(fullscreenInjection, fullscreen)
    provide(httpClientInjection, httpClient)

    return { appInfo, appState, httpClient }
}

export { clientMode, installAppService, useHttpClient }
