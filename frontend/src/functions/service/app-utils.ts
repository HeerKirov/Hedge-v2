import { onMounted, onUnmounted, readonly, ref } from "vue"
import { remote, ipc, clientMode, OpenDialogOptions } from "@/functions/adapter-ipc"

export const dialogManager = clientMode ? {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        const res = await remote.dialog.openDialog(options)
        return res && res.length ? res : null
    }
} : {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        throw new Error("openDialog() cannot only be used in client mode.")
    }
}

export const windowManager = clientMode ? {
    newWindow(route?: string, param?: any) {
        ipc.window.openNewWindow({routeName: route, routeParam: param}).finally(() => {})
    },
    openSetting() {
        ipc.window.openSetting().finally(() => {})
    },
    openGuide() {
        ipc.window.openGuide().finally(() => {})
    }
} : {
    newWindow(route?: string, param?: any) {
        const hashParam = param ? `&param=${encodeURIComponent(JSON.stringify(param))}` : ''
        const hash = route ? `?route=${encodeURIComponent(route)}${hashParam}` : ''
        const url = `${window.location.protocol}//${window.location.host}/#/${hash}`
        window.open(url)
    },
    openSetting() {
        console.warn("Cannot access setting page from web.")
    },
    openGuide() {
        const url = `${window.location.protocol}//${window.location.host}/#/guide`
        window.open(url)
    }
}

export function openExternal(url: string) {
    return remote.shell.openExternal(url)
}

export function useWebAccessUrls() {
    const urls = ref<string[]>([])

    onMounted(async () => urls.value = await ipc.server.webAccessUrls())

    return readonly(urls)
}