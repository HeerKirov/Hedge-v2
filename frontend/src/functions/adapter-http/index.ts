import { HttpInstanceOptions, createHttpInstance } from "./server"
import { createWebService } from './impl/web'

export function createAPIService(options: HttpInstanceOptions) {
    const httpInstance = createHttpInstance(options)

    return {
        web: createWebService(httpInstance)
    }
}