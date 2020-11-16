
export interface RemoteClientAdapter {
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

interface IpcInvoke {
    <T, R>(channel: string, form?: T): Promise<R>
}

export const clientMode: boolean = !!window['clientMode']

export const remoteClientAdapter: RemoteClientAdapter = window['createRemoteClientAdapter']?.()

export const ipcInvoke: IpcInvoke = window['ipcInvoke']
