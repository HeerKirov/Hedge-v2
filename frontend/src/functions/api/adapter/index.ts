export { isInClientMode } from "./ipc"

/**与client连接的通讯函数的接口。 */
export interface Invoke {
    (channelName: string, method: string, meta?: unknown, req?: unknown): Promise<any>
}

/**注册window层级事件的通讯函数接口。 */
export interface RegisterWindowEvents {
    (events: WindowEvents): void
}

/**window层级的事件定义。 */
export interface WindowEvents {
    fullScreenChanged(isFullScreen: boolean): void
}