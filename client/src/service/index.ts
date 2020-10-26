import { AppDataDriver } from "../components/appdata"
import { DatabaseDriver } from "../components/database"
import { WebServer } from "../components/web-server"
import { WindowManager } from "../application/window-manager"
import { Platform } from "../utils/process"
import { State, createState } from "./state"
import { Scope, ValidateMethod } from "./channels/definition"
import { scopes } from "./channels/channels"
import { StatusCode } from "./code"

/**
 * 服务中枢组件。接入外部专有组件，并向下游提供业务逻辑支持。
 * 业务逻辑以channel/scope的形式组装并接入服务中枢。服务中枢不以OOP的方式，而是以channel接口的方式对外提供服务，以方便扩展和下游控制器对接。
 */
export interface Service {
    findAll(): ChannelInstance[]
    find(name: string, method: string): ChannelInstance | null
}

export interface ServiceOptions {
    debugMode: boolean
    platform: Platform
}

export function createService(appDataDriver: AppDataDriver, dbDriver: DatabaseDriver, webServer: WebServer, windowManager: WindowManager, options: ServiceOptions): Service {
    const state = createState()

    const context: ServiceContext = {state, appDataDriver, dbDriver, webServer, windowManager}

    const routers = createChannelInstance(scopes, context, options)

    function findAll(): ChannelInstance[] {
        const ret: ChannelInstance[] = []
        for (const name in routers) {
            const subRouter = routers[name]
            for(const method in subRouter) {
                ret.push(subRouter[method])
            }
        }
        return ret
    }

    function find(name: string, method: string): ChannelInstance | null {
        return routers[name]?.[method] ?? null
    }

    return {findAll, find}
}

function createChannelInstance(scopes: Scope[], context: ServiceContext, options: ServiceOptions) {
    const routers: {
        [name: string]: {
            [method: string]: ChannelInstance
        }
    } = {}

    const analyzeInstanceError = <OUT>(name: string, method: string, e: any): ServResult<OUT> => {
        if(typeof e === 'object' && e.code) {
            return {code: e.code, msg: e.msg}
        }else if(typeof e === 'string') {
            return {code: e as StatusCode}
        }else if(e instanceof Error) {
            console.error(e)
            return {code: "INTERNAL_ERROR", msg: e.message}
        }else{
            console.error(`Unknown error was thrown in channel ${name} [${method}].`, e)
            return {code: "INTERNAL_ERROR"}
        }
    }

    const createAsyncInstance = <META, IN, OUT>(name: string, method: string,
                                                invoke: (meta: META, req: IN) => Promise<OUT>,
                                                validate?: ValidateMethod<META, IN>
    ) => async (meta: META, req: IN): Promise<ServResult<OUT>> => {
        if(validate) {
            const validateResult = validate(meta, req)
            if(validateResult) {
                return {code: validateResult.code ?? "VALIDATE_ERROR", msg: validateResult.msg}
            }
        }
        try {
            const data = await invoke(meta, req)
            return {code: "OK", data}
        }catch (e) {
            return analyzeInstanceError(name, method, e)
        }
    }

    const createSyncInstance = <META, IN, OUT>(name: string, method: string,
                                                invoke: (meta: META, req: IN) => OUT,
                                                validate?: ValidateMethod<META, IN>
    ) => (meta: META, req: IN): ServResult<OUT> => {
        if(validate) {
            const validateResult = validate(meta, req)
            if(validateResult) {
                return {code: validateResult.code ?? "VALIDATE_ERROR", msg: validateResult.msg}
            }
        }
        try {
            const data = invoke(meta, req)
            return {code: "OK", data}
        }catch (e) {
            return analyzeInstanceError(name, method, e)
        }
    }

    for (let scope of scopes) {
        for (let channelConstructor of scope.channels) {
            const channel = channelConstructor(context, options)

            const name = scope.name ? `${scope.name}/${channel.name}` : channel.name
            const method = channel.method ?? 'get'
            const forWeb = channel.forWeb ?? true

            const subRouters = routers[name] ?? (routers[name] = {})

            subRouters[method] = channel.invoke ? {
                name, method, forWeb,
                async: true,
                invoke: createAsyncInstance(name, method, channel.invoke, channel.validate)
            } : channel.invokeSync ? {
                name, method, forWeb,
                async: false,
                invoke: createSyncInstance(name, method, channel.invokeSync, channel.validate)
            } : {
                name, method, forWeb,
                async: false,
                invoke: createSyncInstance(name, method, (): any => {}, channel.validate)
            };
        }
    }

    return routers
}

export interface ServResult<OUT> {
    code: StatusCode
    msg?: string
    data?: OUT
}

export interface ServiceContext {
    state: State
    appDataDriver: AppDataDriver
    dbDriver: DatabaseDriver
    webServer: WebServer
    windowManager: WindowManager
}

interface IChannelInstance {
    name: string
    method: string
    forWeb: boolean
}

interface AsyncChannelInstance extends IChannelInstance {
    async: true
    invoke(meta: any, req: any): Promise<ServResult<any>>
}

interface SyncChannelInstance extends IChannelInstance {
    async: false
    invoke(meta: any, req: any): ServResult<any>
}

export type ChannelInstance = AsyncChannelInstance | SyncChannelInstance
