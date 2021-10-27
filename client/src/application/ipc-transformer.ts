import { ipcMain, dialog, shell, Menu, BrowserWindow, OpenDialogOptions, MessageBoxOptions } from "electron"
import { Service } from "../components/service"
import { sleep } from "../utils/process"
import { MenuTemplateInIpc } from "./preloads/define"

/**
 * 通过ipc信道与前端进行服务通信的controller。将service的功能暴露给前端使用。
 */
export function registerIpcTransformer(service: Service) {
    ipcHandleSync("/app/env", service.app.env)
    ipcHandle("/app/init", service.app.init)
    ipcHandle("/app/login", service.app.login)
    ipcHandle("/app/login-by-touch-id", service.app.loginByTouchID)
    ipcHandle("/server/server-info", service.server.serverInfo)
    ipcHandle("/server/web-access-urls", service.server.webAccessUrls)
    ipcHandle("/window/new-window", service.window.openNewWindow)
    ipcHandle("/window/open-setting", service.window.openSetting)
    ipcHandle("/window/open-guide", service.window.openGuide)
    ipcHandle("/cli/status", service.cli.status)
    ipcHandle("/cli/update", service.cli.update)
    ipcHandle("/appearance/get", service.appearance.get)
    ipcHandle("/appearance/set", service.appearance.set)
    ipcHandle("/auth/get", service.auth.get)
    ipcHandle("/auth/set", service.auth.set)
    ipcHandle("/channel/list", service.channel.list)
    ipcHandle("/channel/get-default", service.channel.getDefault)
    ipcHandle("/channel/set-default", service.channel.setDefault)
    ipcHandleSync("/channel/change", service.channel.change)

    ipcEvent("/app/state/changed", service.app.onStateChanged)
    ipcEvent("/app/init/changed", service.app.onInitStateChanged)
}

/**
 * 异步的、有返回的请求。
 */
function ipcHandle<T, R>(channel: string, invoke: (f: T) => Promise<R>) {
    ipcMain.handle(channel, (event, args) => invoke(args))
}

/**
 * 同步的、有返回的请求。
 */
function ipcHandleSync<T, R>(channel: string, invoke: (f: T) => R) {
    ipcMain.on(channel, (event, args) => {
        event.returnValue = invoke(args)
    })
}

/**
 * 从客户端主动发送的ipc通信。
 */
function ipcEvent<T>(channel: string, on: (event: (f: T) => void) => void) {
    on(args => {
        for (let window of BrowserWindow.getAllWindows()) {
            window.webContents.send(channel, args)
        }
    })
}

/**
 * 通过ipc信道，向前端注册remote类功能。将窗口和app相关的功能暴露给前端使用。
 */
export function registerIpcRemoteHandle() {
    ipcMain.on("/remote/fullscreen", (e) => {
        e.returnValue = BrowserWindow.fromWebContents(e.sender)!.isFullScreen()
    })
    ipcMain.on("/remote/fullscreen/set", (e, value: boolean) => {
        BrowserWindow.fromWebContents(e.sender)!.setFullScreen(value)
    })
    ipcMain.handle("/remote/dialog/openDialog", async (e, value: OpenDialogOptions) => {
        return await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender)!, value)
    })
    ipcMain.handle("/remote/dialog/showMessage", async (e, value: MessageBoxOptions) => {
        return await dialog.showMessageBox(BrowserWindow.fromWebContents(e.sender)!, value)
    })
    ipcMain.on("/remote/dialog/showError", (e, { title, message }: {title: string, message: string}) => {
        dialog.showErrorBox(title, message)
    })
    ipcMain.on("/remote/menu/popup", async (e, { requestId, items, options }: {requestId: number, items: MenuTemplateInIpc[], options?: { x: number; y: number }}) => {
        let clicked = false
        const finalItems = items.map(item => {
            if((item.type === "normal" || item.type === "radio" || item.type === "checkbox") && item.eventId != undefined) {
                const { eventId, ...leave } = item
                return {
                    ...leave,
                    click() {
                        clicked = true
                        e.sender.send(`/remote/menu/popup/response/${requestId}`, eventId)
                    }
                }
            }else{
                return item
            }
        })

        const menu = Menu.buildFromTemplate(finalItems)
        menu.once("menu-will-close", async () => {
            await sleep(500)
            if(!clicked) {
                //在延时之后检测是否clicked，如果没有就发送一个内容为undefined的事件，防止渲染端内存泄露
                e.sender.send(`/remote/menu/popup/response/${requestId}`, undefined)
            }
        })
        const window = BrowserWindow.fromWebContents(e.sender)!
        if(options) {
            menu.popup({window, ...options})
        }else{
            menu.popup({window})
        }
    })
    ipcMain.on("/remote/shell/openExternal", (e, url: string) => {
        shell.openExternal(url).catch(reason => dialog.showErrorBox("打开链接时发生错误", reason))
    })
}

/**
 * 通过ipc信道，向前端注册remote类功能。此函数调用以对每个window注册响应事件。
 */
export function registerIpcRemoteEvent(win: BrowserWindow) {
    win.on("enter-full-screen", () => win.webContents.send("/remote/fullscreen/onChanged", true))
    win.on("leave-full-screen", () => win.webContents.send("/remote/fullscreen/onChanged", false))
}
