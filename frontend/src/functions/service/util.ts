import { getRemoteClient, getIpcService } from "@/functions/adapter-ipc"
import { clientMode, OpenDialogOptions } from "../adapter-ipc/client"

export const dialogManager = clientMode ? {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        return await getRemoteClient().dialog.openDialog(options)
    }
} : {
    async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
        throw new Error("openDialog() cannot only be used in client mode.")
    }
}

export const windowManager = clientMode ? {
    newWindow(route?: string, param?: any) {
        getIpcService().window.openNewWindow({routeName: route, routeParam: param}).finally(() => {})
    },
    openSetting() {
        getIpcService().window.openSetting().finally(() => {})
    },
    openGuide() {
        getIpcService().window.openGuide().finally(() => {})
    }
} : {
    newWindow(route?: string, param?: any) {
        const hashParam = param ? `&param=${encodeURIComponent(JSON.stringify(param))}` : ''
        const hash = route ? `?route=${encodeURIComponent(route)}${hashParam}` : ''
        const url = `${window.location.protocol}//${window.location.host}/#/${hash}`
        window.open(url)
    },
    openSetting() {
        const url = `${window.location.protocol}//${window.location.host}/#/setting`
        window.open(url)
    },
    openGuide() {
        const url = `${window.location.protocol}//${window.location.host}/#/guide`
        window.open(url)
    }
}