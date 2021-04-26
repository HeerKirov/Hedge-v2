import { clientMode, remote } from "@/functions/adapter-ipc"


export interface OpenExternalFunction {
    (url: string): void
}

export const openExternal: OpenExternalFunction = clientMode
    ? (url: string) => remote.shell.openExternal(analyseSafeURL(url))
    : (url: string) => window.open(analyseSafeURL(url))

function analyseSafeURL(url: string): string {
    if(url.startsWith("http://") || url.startsWith("https://")) {
        return url
    }else{
        return `http://${url}`
    }
}

export function writeClipboard(text: string) {
    window.navigator.clipboard.writeText(text).catch(console.error)
}