import { clientMode, ipc } from "@/functions/adapter-ipc"


export interface WindowManager {
    newWindow(route?: string, param?: any)
    openSetting()
    openGuide()
}

export const windowManager: WindowManager = clientMode ? {
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
