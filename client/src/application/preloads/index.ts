import { ipcRenderer, remote } from "electron"

/*
 * 定义在client，但实际上要注入页面在前端运行的脚本。
 * 这一部分的作用是把来自Electron的API抽离到单一脚本内隔离，并直接注入前端，使用接口模式无感知地运行。
 */

/**
 * 向ipcRenderer发送invoke调用。
 * @param channelName channel名称，对应的是service中的channel名称
 * @param method channel method
 * @param meta 调用元信息
 * @param req 调用业务内容
 */
async function invokeIpc(channelName: string, method: string, meta: unknown, req: unknown): Promise<unknown> {
    return await ipcRenderer.invoke(`serv/${channelName}[${method}]`, [meta, req])
}

/**
 * 注册那些全局环境的事件。
 * @param events
 */
function registerElectronEvents(events: AppEvents) {
    const window = remote.getCurrentWindow();
    window.on("enter-full-screen", () => {
        events.fullScreenChanged(true)
    })
    window.on("leave-full-screen", () => {
        events.fullScreenChanged(false)
    })
}

/**
 * 全局事件定义。
 */
interface AppEvents {
    fullScreenChanged(isFullScreen: boolean): void
}

(() => {
    const w = window as any

    w['clientMode'] = true
    w['invokeIpc'] = invokeIpc
    w['registerElectronEvents'] = registerElectronEvents
})()
