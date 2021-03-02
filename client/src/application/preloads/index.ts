import { ipcRenderer, remote, shell } from "electron"

/**
 * 定义在client，但实际上要注入页面在前端运行的脚本。
 * 这一部分的作用是把来自Electron的API抽离到单一脚本内隔离，并直接注入前端，使用接口模式无感知地运行。
 */
interface RemoteClientAdapter {
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
         * 创建一个弹出菜单的调用。
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

type MenuTemplate = NormalMenuTemplate | SeparatorMenuTemplate | SubMenuTemplate
interface NormalMenuTemplate {
    label: string
    enabled?: boolean
    type: "normal"
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
interface Menu {
    popup(options?: {x: number, y: number}): void
}

interface OpenDialogOptions {
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

function createRemoteClientAdapter(): RemoteClientAdapter {
    const window = remote.getCurrentWindow()
    return {
        fullscreen: {
            isFullscreen() {
                return window.isFullScreen()
            },
            onFullscreenChanged(event: (fullscreen: boolean) => void) {
                window.on("enter-full-screen", () => event(true))
                window.on("leave-full-screen", () => event(false))
            },
            setFullscreen(fullscreen: boolean) {
                window.setFullScreen(fullscreen)
            }
        },
        menu: {
            createPopup(items: MenuTemplate[]) {
                const menu = remote.Menu.buildFromTemplate(items)
                return {
                    popup(options) {
                        if(options && options.x && options.y) {
                            menu.popup({window, ...options})
                        }else{
                            menu.popup({window})
                        }
                    }
                }
            }
        },
        dialog: {
            async openDialog(options: OpenDialogOptions): Promise<string[] | null> {
                const result = await remote.dialog.showOpenDialog(window, options)
                return result.canceled || result.filePaths.length <= 0 ? null : result.filePaths
            },
            async showMessage(options: MessageOptions): Promise<number> {
                const result = await remote.dialog.showMessageBox(window, options)
                return result.response
            },
            showError(title: string, message: string) {
                remote.dialog.showErrorBox(title, message)
            }
        },
        shell: {
            openExternal(url: string) {
                shell.openExternal(url).catch(reason => remote.dialog.showErrorBox("打开链接时发生错误", reason))
            }
        }
    }
}

/**
 * 对接ipcRenderer。
 */
function ipcInvoke<T, R>(channel: string, form?: T): Promise<R> {
    return ipcRenderer.invoke(channel, form)
}

/**
 * 对接ipcRenderer的同步实现。
 */
function ipcInvokeSync<T, R>(channel: string, form?: T): R {
    return ipcRenderer.sendSync(channel, form)
}

/**
 * 对接ipcRenderer。
 */
function ipcOn<T>(channel: string, event: (arg?: T) => void) {
    ipcRenderer.on(channel, (_, args) => {
        console.debug(`[ipc] receive ${channel} : ${args}`)
        event(args)
    })
}

(() => {
    const w = window as any
    w["clientMode"] = true
    w["ipcInvoke"] = ipcInvoke
    w["ipcInvokeSync"] = ipcInvokeSync
    w["ipcOn"] = ipcOn
    w["createRemoteClientAdapter"] = createRemoteClientAdapter
})()
