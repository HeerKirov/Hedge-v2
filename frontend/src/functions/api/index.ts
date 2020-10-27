import { Invoke, isInClientMode, RegisterWindowEvents } from "./adapter"
import { inject as injectClient } from "./adapter/ipc"
import { inject as injectWeb } from "./adapter/web"
import { APIControllers, createAPIControllers } from "./controller"

export interface APIClient {
    api: APIControllers
    registerWindowEvents: RegisterWindowEvents
    clientMode: boolean
}

/**创建API客户端。
 * 在创建过程中，识别自己运行在何种模式下，并进行正确的创建注入。
 */
export function createAPIClient() {
    const clientMode = isInClientMode()

    const { invoke, registerWindowEvents } = clientMode ? injectClient() : injectWeb()

    const api = createAPIControllers(invoke)

    return {api, registerWindowEvents, clientMode}
}