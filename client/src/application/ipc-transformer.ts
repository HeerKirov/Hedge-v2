import { ipcMain } from "electron"
import { Service } from "../service"
import { Platform } from "../utils/process"

const CHANNEL_SERVICE_PREFIX = "serv"

export interface IpcTransformerOptions {
    debugMode: boolean
    platform: Platform
    appDataPath: string
}

/**
 * 通过ipc信道与前端进行服务通信的controller。
 * 它的职责是将全部service提供给前端使用。此外还提供一些平台类参数的快查。
 */
export function createIpcTransformer(service: Service, options: IpcTransformerOptions) {
    /**
     * ipc transformer将全部service的channel，每个channel对应一个ipc channel注册。
     * 注册的channel name为`${PREFIX}/${scope}/${name}[${method}]`。
     * 注册的channel的args为[META, IN]。
     * 注册的channel的返回值为ServResult<OUT>。
     * 异步channel通过handle方法注册，在ipdRenderer通过invoke调用并异步接收。handle方法同时支持异步和同步，因此闭包函数不需要async/await。
     */
    for (const channelInstance of service.findAll()) {
        const channelName = `${CHANNEL_SERVICE_PREFIX}/${channelInstance.name}[${channelInstance.method}]`
        ipcMain.handle(channelName, (event, args) => {
            const [meta, req] = args

            return channelInstance.invoke(meta, req)
        })
    }
}
