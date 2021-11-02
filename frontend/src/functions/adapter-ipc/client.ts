import { ClientPlatform } from "@/functions/adapter-ipc/ipc"
import { getOSName, OSName } from "@/utils/process"

export interface RemoteClientAdapter {
    fullscreen: {
        /**
         * 判断当前是否处于全屏状态。
         */
        isFullscreen(): boolean
        /**
         * 全屏状态发生变化时触发事件。
         * @param event
         */
        onFullscreenChanged(event: (fullscreen: boolean) => void): void
        /**
         * 手动设置全屏状态。
         * @param fullscreen
         */
        setFullscreen(fullscreen: boolean): void
    }
    menu: {
        /**
         * 创建一个弹出菜单的调用。给出菜单模板，返回一个函数，调用此函数以弹出此菜单。
         */
        createPopup(items: MenuTemplate[]): Menu
    }
    dialog: {
        /**
         * 打开一个对话框用于打开文件或文件夹。
         * @param options 对话框的配置项
         * @return 如果选择了项并确认，返回选择项的文件地址；否则返回null
         */
        openDialog(options: OpenDialogOptions): Promise<string[] | null>
        /**
         * 弹出一个消息框。
         * @param options
         */
        showMessage(options: MessageOptions): Promise<number>
        /**
         * 弹出一个专用于错误抛出的消息框。
         * @param title
         * @param message
         */
        showError(title: string, message: string): void
    }
    shell: {
        /**
         * 使用系统指定的程序打开协议。
         * @param url
         */
        openExternal(url: string): void
    }
}

export type MenuTemplate = NormalMenuTemplate | CheckboxMenuTemplate | RadioMenuTemplate | SeparatorMenuTemplate | SubMenuTemplate
interface NormalMenuTemplate {
    label: string
    enabled?: boolean
    type: "normal"
    click?(): void
}
interface CheckboxMenuTemplate {
    label: string
    enabled?: boolean
    type: "checkbox"
    checked?: boolean
    click?(): void
}
interface RadioMenuTemplate {
    label: string
    enabled?: boolean
    type: "radio"
    checked?: boolean
    click?(): void
}
interface SeparatorMenuTemplate {
    type: "separator"
}
interface SubMenuTemplate {
    label: string
    enabled?: boolean
    type: "submenu"
    submenu: MenuTemplate[]
}
export interface Menu {
    popup(options?: {x: number, y: number}): void
}

export interface OpenDialogOptions {
    title?: string
    defaultPath?: string
    filters?: {name: string, extensions: string[]}[]
    properties?: ("openFile" | "openDirectory" | "multiSelections" | "createDirectory"/*macOS*/)[]
}

export interface MessageOptions {
    type: "none" | "info" | "error" | "question"
    buttons?: string[]
    defaultButtonId?: number
    title?: string
    message: string
    detail?: string
}

type IpcInvoke = <T, R>(channel: string, form?: T) => Promise<R>

type IpcInvokeSync = <T, R>(channel: string, form?: T) => R

type IpcOn = <T>(channel: string, event: (form: T) => void) => void

function forbidden (): any {
    throw new Error("Cannot call IPC in web.")
}

function createEmptyRemoteClientAdapter(): RemoteClientAdapter {
    return {
        fullscreen: {
            isFullscreen: forbidden,
            onFullscreenChanged: forbidden,
            setFullscreen: forbidden
        },
        menu: {
            createPopup: forbidden
        },
        dialog: {
            openDialog: forbidden,
            showMessage: forbidden,
            showError: forbidden
        },
        shell: {
            openExternal: forbidden
        }
    }
}

export const clientMode: boolean = !!window['clientMode']

export const clientPlatform: OSName = clientMode ? window['platform'] as ClientPlatform : getOSName()

export const ipcInvoke: IpcInvoke = clientMode ? window['ipcInvoke'] : forbidden

export const ipcInvokeSync: IpcInvokeSync = clientMode ? window['ipcInvokeSync'] : forbidden

export const ipcOn: IpcOn = clientMode ? window['ipcOn'] : () => {}

export const remote: RemoteClientAdapter = clientMode ? window['createRemoteClientAdapter']() : createEmptyRemoteClientAdapter()
