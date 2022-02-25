import { inject, InjectionKey } from "vue"
import { HttpClient } from "@/functions/adapter-http"

export const httpClientInjection: InjectionKey<HttpClient> = Symbol()

export function useHttpClient(): HttpClient {
    return inject(httpClientInjection)!
}
