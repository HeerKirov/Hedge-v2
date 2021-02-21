import type { HttpClient, HttpClientConfig } from "./server"
import { createHttpClient } from "./server"
import { createWebEndpoint, WebEndpoint } from "./impl/web"

export { HttpClient, HttpClientConfig, createHttpClient }

export interface ApiClient {
    web: WebEndpoint
}

export function createApiClient(httpInstance: HttpClient): ApiClient {
    return {
        web: createWebEndpoint(httpInstance)
    }
}
