import { ipcMain } from "electron"
import { Service } from "../service"
import { Platform } from "../utils/process"

const CHANNEL_SERVICE = "ipc-transformer-channel"
const CHANNEL_PLATFORM = "ipc-transformer-platform"

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
     * - service serv
     *   使用信道${CHANNEL_SERVICE}。信道使用handle模式运行，即ipcRenderer使用invoke发送参数，并异步等待结果。
     *   接受的args(即ipcRenderer发送的args)依次为[scope, channel, method, meta, requestBody]。
     *   返回的内容(即ipcRenderer接受的内容)为{code: StatusCode, msg?: string, data?: OUT}。
     */
    ipcMain.handle(CHANNEL_SERVICE, async (event, args) => {
        const [scope, channel, method, meta, req] = args

        return await service.serv({scope, channel, method, meta, req})
    })

    /**
     * - platform query
     *   使用信道${CHANNEL_PLATFORM}。使用sendSync模式运行，即ipcRenderer使用sendSync发送参数，并立即接收结果。
     *   返回的内容为{debugMode, platform, appDataPath}。
     */
    ipcMain.on(CHANNEL_PLATFORM, (event) => {
        event.returnValue = {
            debugMode: options.debugMode,
            platform: options.platform,
            appDataPath: options.appDataPath
        }
    })
}
