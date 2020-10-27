import { APIFunction, APIFunctionWithReq, ControllerContext } from "."

export interface AppController {
    env: APIFunction<EnvRes>
    location: APIFunction<LocationRes>
    login: APIFunctionWithReq<LoginReq, LoginRes>
    loginByTouchID: APIFunction<LoginRes>
}

export interface LoginReq {
    password: string
}

export interface EnvRes {
    /**客户端运行的平台。 */
    platform: "win32" | "darwin" | "linux"
    /**当前是否在debug模式中运行。 */
    debug: boolean
    /**客户端的appdata路径。 */
    appDataPath: string
    /**客户端的用户~路径。 */
    userFolderPath: string
    /**客户端可以调用touchID。 */
    canPromptTouchID: boolean
}

export interface LocationRes {
    /**App所处的初始化和进程状态。 */
    location: "init" | "login" | "start" | "hedge"
}

export interface LoginRes extends LocationRes {
    ok: boolean
}

export function createAppController(context: ControllerContext): AppController {
    return {
        env: context.define('app/env', 'get'),
        location: context.define('app/location', 'get'),
        login: context.defineWithReq('app/login', 'post'),
        loginByTouchID: context.define('app/login-by-touch-id', 'post')
    }
}