import { ipcMain } from "electron"
import { Service } from "../components/service"

/**
 * 通过ipc信道与前端进行服务通信的controller。将service的功能暴露给前端使用。
 */
export function registerIpcTransformer(service: Service) {
    ipcHandleSync("/app/env", service.app.env)
    ipcHandleSync("/app/status", service.app.status)
    ipcHandle("/app/init", service.app.init)
    ipcHandle("/app/login", service.app.login)
    ipcHandle("/app/login-by-touch-id", service.app.loginByTouchID)
    ipcHandleSync("/resource/server/status", service.resource.server.status)
    ipcHandle("/resource/server/update", service.resource.server.update)
    ipcHandleSync("/resource/cli/status", service.resource.cli.status)
    ipcHandle("/resource/cli/update", service.resource.cli.update)
    ipcHandleSync("/server/status", service.server.status)
    ipcHandle("/server/env", service.server.env)
    ipcHandle("/server/open", service.server.open)
    ipcHandle("/server/close", service.server.close)
    ipcHandle("/server/init", service.server.init)
    ipcHandleSync("/setting/auth/get", service.setting.auth.get)
    ipcHandle("/setting/auth/set", service.setting.auth.set)
    ipcHandle("/setting/channel/list", service.setting.channel.list)
    ipcHandle("/setting/channel/set-default", service.setting.channel.setDefault)
    ipcHandleSync("/setting/channel/change", service.setting.channel.change)
    ipcHandle("/window/new-window", service.window.openNewWindow)
    ipcHandle("/window/open-setting", service.window.openSetting)
    ipcHandle("/window/open-guide", service.window.openGuide)
}

function ipcHandle<T, R>(channel: string, invoke: (f: T) => Promise<R>) {
    ipcMain.handle(channel, (event, args) => invoke(args))
}

function ipcHandleSync<T, R>(channel: string, invoke: (f: T) => R) {
    ipcMain.on(channel, (event, args) => {
        event.returnValue = invoke(args)
    })
}
