import { ipcRenderer, remote } from "electron"

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
        }
    }
}

/**
 * 对接ipcRenderer。
 */
function ipcInvoke<T, R>(channel: string, form?: T): Promise<R> {
    return ipcRenderer.invoke(channel, [form])
}

(() => {
    const w = window as any
    w["clientMode"] = true
    w["ipcInvoke"] = ipcInvoke
    w["createRemoteClientAdapter"] = createRemoteClientAdapter
})()
