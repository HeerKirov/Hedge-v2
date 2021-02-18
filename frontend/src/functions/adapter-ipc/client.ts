
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
        createPopup(items: MenuTemplate[]): () => void
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
}

export interface MenuTemplate {
    label?: string
    enabled?: boolean
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
    submenu?: MenuTemplate[]
    click?(): void
}

export interface OpenDialogOptions {
    title?: string
    defaultPath?: string
    filters?: {name: string, extensions: string[]}[]
    properties?: ("openFile" | "openDirectory" | "multiSelections" | "createDirectory"/*macOS*/)[]
}

interface MessageOptions {
    type: "none"|"info"|"error"|"question"
    buttons?: string[]
    defaultButtonId?: number
    title?: string
    message: string
    detail?: string
}

type IpcInvoke = <T, R>(channel: string, form?: T) => Promise<R>

type IpcInvokeSync = <T, R>(channel: string, form?: T) => R

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
        }
    }
}

export const clientMode: boolean = !!window['clientMode']

export const createRemoteClientAdapter: () => RemoteClientAdapter = clientMode ? window['createRemoteClientAdapter'] : createEmptyRemoteClientAdapter

export const ipcInvoke: IpcInvoke = clientMode ? window['ipcInvoke'] : forbidden

export const ipcInvokeSync: IpcInvokeSync = clientMode ? window['ipcInvokeSync'] : forbidden
