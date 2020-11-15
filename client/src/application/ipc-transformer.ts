import { ipcMain } from "electron"
import { Service } from "../components/service"

/**
 * 通过ipc信道与前端进行服务通信的controller。将service的功能暴露给前端使用。
 */
export function createIpcTransformer(service: Service) {
    ipcHandle("/app/env", service.app.env)
    ipcHandle("/app/status", service.app.status)
    ipcHandle("/app/init", service.app.init)
    ipcHandle("/app/login", service.app.login)
    ipcHandle("/app/login-by-touch-id", service.app.loginByTouchID)
    ipcHandle("/resource/server/status", service.resource.server.status)
    ipcHandle("/resource/server/update", service.resource.server.update)
    ipcHandle("/resource/cli/status", service.resource.cli.status)
    ipcHandle("/resource/cli/update", service.resource.cli.update)
    ipcHandle("/server/status", service.server.status)
    ipcHandle("/server/env", service.server.env)
    ipcHandle("/server/open", service.server.open)
    ipcHandle("/server/close", service.server.close)
    ipcHandle("/server/init", service.server.init)
    ipcHandle("/setting/auth/get", service.setting.auth.get)
    ipcHandle("/setting/auth/set", service.setting.auth.set)
    ipcHandle("/setting/channel/list", service.setting.channel.list)
    ipcHandle("/setting/channel/set-default", service.setting.channel.setDefault)
    ipcHandle("/setting/channel/change", service.setting.channel.change)
    ipcHandle("/storage/get", service.storage.get)
    ipcHandle("/storage/set", service.storage.set)
}

function ipcHandle<T, R>(channel: string, invoke: (f: T) => Promise<R>) {
    ipcMain.handle(channel, (event, args) => invoke(args[0]))
}
