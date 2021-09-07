import { ipcRenderer, contextBridge } from "electron"
import { MenuTemplate, Menu, OpenDialogOptions, MessageOptions } from "./define"

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

function createRemoteClientAdapter(): RemoteClientAdapter {
    let popupRequestId = 0

    return {
        fullscreen: {
            isFullscreen() {
                return ipcRenderer.sendSync("/remote/fullscreen")
            },
            onFullscreenChanged(event: (fullscreen: boolean) => void) {
                ipcRenderer.on("/remote/fullscreen/onChanged", (_, arg: boolean) => event(arg))
            },
            setFullscreen(fullscreen: boolean) {
                ipcRenderer.send("/remote/fullscreen/set", fullscreen)
            }
        },
        menu: {
            createPopup(items: MenuTemplate[]) {
                const callbacks: (() => void)[] = []

                const refItems = items.map(item => {
                    if((item.type === "normal" || item.type === "radio" || item.type === "checkbox") && item.click !== undefined) {
                        const { click, ...leave } = item
                        callbacks.push(click)
                        return {
                            ...leave,
                            eventId: callbacks.length - 1
                        }
                    }else{
                        return item
                    }
                })
                return {
                    popup(options?: { x: number; y: number }) {
                        const requestId = ++popupRequestId
                        ipcRenderer.send("/remote/menu/popup", {requestId, items: refItems, options: options && options.x != null && options.y != null ? options : undefined})
                        ipcRenderer.once(`/remote/menu/popup/response/${requestId}`, (_, eventId: number | undefined) => {
                            if(eventId != undefined) {
                                callbacks[eventId]?.()
                            }
                        })
                    }
                }
            }
        },
        dialog: {
            async openDialog(options: OpenDialogOptions) {
                const result = await ipcRenderer.invoke("/remote/dialog/openDialog", options)
                return result.canceled || result.filePaths.length <= 0 ? null : result.filePaths
            },
            async showMessage(options: MessageOptions) {
                const result = await ipcRenderer.invoke("/remote/dialog/showMessage", options)
                return result.response
            },
            showError(title: string, message: string) {
                ipcRenderer.send("/remote/dialog/showError", {title, message})
            }
        },
        shell: {
            openExternal(url: string) {
                ipcRenderer.send("/remote/shell/openExternal", url)
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

contextBridge.exposeInMainWorld("clientMode", true)
contextBridge.exposeInMainWorld("ipcInvoke", ipcInvoke)
contextBridge.exposeInMainWorld("ipcInvokeSync", ipcInvokeSync)
contextBridge.exposeInMainWorld("ipcOn", ipcOn)
contextBridge.exposeInMainWorld("createRemoteClientAdapter", createRemoteClientAdapter)
