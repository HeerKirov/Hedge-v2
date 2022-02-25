import { clientMode, ipc } from "@/functions/adapter-ipc"

export interface WindowManager {
    newWindow()
    newWindow(url: string)
    openSetting()
    openGuide()
}

export const windowManager: WindowManager = clientMode ? {
    newWindow(url?: string) {
        ipc.window.openNewWindow(url).finally(() => {})
    },
    openSetting() {
        ipc.window.openSetting().finally(() => {})
    },
    openGuide() {
        ipc.window.openGuide().finally(() => {})
    }
} : {
    newWindow(url?: string) {
        window.open(`${window.location.protocol}//${window.location.host}/#${url}`)
    },
    openSetting() {
        console.warn("Cannot access setting page from web.")
    },
    openGuide() {
        window.open(`${window.location.protocol}//${window.location.host}/#/guide`)
    }
}
