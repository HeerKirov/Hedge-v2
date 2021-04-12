import { clientMode, remote } from "@/functions/adapter-ipc"


export interface OpenExternalFunction {
    (url: string): void
}

export const openExternal: OpenExternalFunction = clientMode
    ? (url: string) => remote.shell.openExternal(url)
    : (url: string) => window.open(url)

