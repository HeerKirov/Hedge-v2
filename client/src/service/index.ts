import { AppDataDriver } from "../components/appdata"
import { DatabaseDriver } from "../components/database"
import { WebServer } from "../components/web-server"
import { WindowManager } from "../application/window-manager"
import { Platform } from "../utils/process"
import { State, createState } from "./state"
import { Channel, Scope, scopes } from "./impl"
import { StatusCode } from "./code"

/**
 * 服务中枢组件。接入外部专有组件，并向下游提供业务逻辑支持。
 * 业务逻辑以channel/scope的形式组装并接入服务中枢。服务中枢不以OOP的方式，而是以channel接口的方式对外提供服务，以方便扩展和下游控制器对接。
 */
export interface Service {
    serv<META, IN, OUT>(context: ServiceServContext<META, IN>): Promise<ServiceServResponse<OUT>>
}

export interface ServiceServContext<META, IN> {
    scope?: string,
    channel: string,
    method?: string,
    meta: META,
    req: IN
}

export interface ServiceServResponse<OUT> {
    code: StatusCode
    msg?: string
    data?: OUT
}

export interface ServiceOptions {
    debugMode: boolean
    platform: Platform
}

export interface ServiceContext {
    state: State
    appDataDriver: AppDataDriver
    dbDriver: DatabaseDriver
    webServer: WebServer
    windowManager: WindowManager
}

export function createService(appDataDriver: AppDataDriver, dbDriver: DatabaseDriver, webServer: WebServer, windowManager: WindowManager, options: ServiceOptions): Service {
    const state = createState()

    const context: ServiceContext = {state, appDataDriver, dbDriver, webServer, windowManager}

    const router = createChannelRouter(scopes, context, options)

    async function serv<META, IN, OUT>(context: ServiceServContext<META, IN>): Promise<ServiceServResponse<OUT>> {
        const channel = router.route(context.scope, context.channel, context.method)
        if(channel == null) {
            return {code: "NOT_FOUND"}
        }
        if(channel.validate) {
            const validateResult = await channel.validate(context.meta, context.req)
            if(validateResult) {
                return {code: validateResult.code ?? "VALIDATE_ERROR", msg: validateResult.msg}
            }
        }
        try {
            const data = await channel.call(context.meta, context.req)
            return {code: "OK", data}
        }catch (e) {
            if(typeof e === 'object' && e.code) {
                return {code: e.code, msg: e.msg}
            }else if(typeof e === 'string') {
                return {code: e as StatusCode}
            }else if(e instanceof Error) {
                console.error(e)
                return {code: "INTERNAL_ERROR", msg: e.message}
            }else{
                console.error(`Unknown error is thrown in channel ${context.scope ?? '_'}/${context.channel}/${context.method ?? 'default'}.`, e)
                return {code: "INTERNAL_ERROR"}
            }
        }
    }

    return {serv}
}

function createChannelRouter(scopes: Scope[], context: ServiceContext, options: ServiceOptions) {
    const routers: {[route: string]: Channel<any, any, any>} = {}

    for (let scope of scopes) {
        for (let channelConstructor of scope.channels) {
            const channel = channelConstructor(context, options)
            routers[`${scope.name ?? '_'}/${channel.name}/${channel.method ?? 'default'}`] = channel
        }
    }

    function route(scope: string | undefined, channel: string, method?: string) {
        return routers[`${scope ?? '_'}/${channel}/${method ?? 'default'}`]
    }

    return {route}
}
