import { clientMode, remote } from "@/functions/adapter-ipc"


export interface OpenExternalFunction {
    (url: string): void
}

//TODO 协议问题：如果url未指定协议，需要补充协议类型，防止调用失败，并保证总是调用http/https浏览器
export const openExternal: OpenExternalFunction = clientMode
    ? (url: string) => remote.shell.openExternal(url)
    : (url: string) => window.open(url)

