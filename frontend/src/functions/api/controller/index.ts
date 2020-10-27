import { Invoke } from "../adapter"
import { AppController, createAppController } from "./app"
import { StatusCode } from "../code"

/**
 * 提供来自client的各种API。
 */
export interface APIControllers {
    app: AppController
}

export function createAPIControllers(invoke: Invoke): APIControllers {
    const context = generateControllerContext(invoke)
    return {
        app: createAppController(context)
    }
}

/**API的返回结构。*/
export interface ServResult<T> {
    code: StatusCode
    msg?: string
    data?: T
}

export interface ControllerContext {
    define<OUT>(channelName: string, method?: string): APIFunction<OUT>
    defineWithReq<IN, OUT>(channelName: string, method?: string): APIFunctionWithReq<IN, OUT>
    defineWithMeta<META, OUT>(channelName: string, method?: string): APIFunctionWithMeta<META, OUT>
    defineWithAll<META, IN, OUT>(channelName: string, method?: string): APIFunctionWithAll<META, IN, OUT>
}

export type APIFunction<OUT> = () => Promise<ServResult<OUT>>
export type APIFunctionWithReq<IN, OUT> = (req: IN) => Promise<ServResult<OUT>>
export type APIFunctionWithMeta<META, OUT> = (meta: META) => Promise<ServResult<OUT>>
export type APIFunctionWithAll<META, IN, OUT> = (meta: META, req: IN) => Promise<ServResult<OUT>>

function generateControllerContext(invoke: Invoke): ControllerContext {
    const define = <OUT>(channelName: string, method?: string) => async (): Promise<ServResult<OUT>> => invoke(channelName, method ?? 'get')

    const defineWithReq = <IN, OUT>(channelName: string, method?: string) => async (req: IN): Promise<ServResult<OUT>> => invoke(channelName, method ?? 'get', null, req)

    const defineWithMeta = <META, OUT>(channelName: string, method?: string) => async (meta: META): Promise<ServResult<OUT>> => invoke(channelName, method ?? 'get', meta)

    const defineWithAll = <META, IN, OUT>(channelName: string, method?: string) => async (meta: META, req: IN): Promise<ServResult<OUT>> => invoke(channelName, method ?? 'get', meta, req)

    return {define, defineWithReq, defineWithMeta, defineWithAll}
}