import { computed, ref } from "vue"
import { getRemoteClient, getIpcService, NativeTheme, clientMode, OpenDialogOptions } from "@/functions/adapter-ipc"

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
        console.warn("Cannot access setting page from web.")
    },
    openGuide() {
        const url = `${window.location.protocol}//${window.location.host}/#/guide`
        window.open(url)
    }
}

export function useNativeTheme() {
    if(clientMode) {
        let nativeTheme = ref<NativeTheme>()

        return computed<NativeTheme>({
            get() {
                return nativeTheme.value || (nativeTheme.value = getIpcService().setting.appearance.getTheme())
            },
            set(value) {
                getIpcService().setting.appearance.setTheme(nativeTheme.value = value).catch(e => console.error(e))
            }
        })
    }else{
        return computed<NativeTheme>(() => "system")
    }
}