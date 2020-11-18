import { createHttpInstance, HttpInstance } from "./server"
import { createWebService, WebService } from "./impl/web"

export { HttpInstance }

export interface APIService {
    web: WebService
}

export function createAPIService(): APIService {
    const httpInstance = createHttpInstance()

    return {
        web: createWebService(httpInstance)
    }
}
