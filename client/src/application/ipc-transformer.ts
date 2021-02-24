import { ipcMain, BrowserWindow } from "electron"
import { Service } from "../components/service"

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