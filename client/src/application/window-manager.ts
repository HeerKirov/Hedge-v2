import * as path from "path"
import { BrowserWindow } from "electron"
import { Platform } from "../utils/process"
import { StateManager } from "../components/state"
import { APP_FILE, RESOURCE_FILE } from "../definitions/file"

/**
 * electron的窗口管理器。管控窗口的建立。
 * 窗口管理器会区分不同业务的窗口。
 */
export interface WindowManager {
    /**
     * 创建一个承载一般业务的普通窗口。
     */
    createWindow(): BrowserWindow
    /**
     * 创建一个轮播图片专用的窗口。
     */
    createDisplayWindow(/*content*/): BrowserWindow | null
    /**
     * 打开guide窗口。
     */
    openGuideWindow(): BrowserWindow
    /**
     * 打开设置窗口。
     */
    openSettingWindow(): BrowserWindow | null
    /**
     * 获得全部窗口列表。
     */
    getAllWindows(): BrowserWindow[]
}

export interface WindowManagerOptions {
    platform: Platform
    debug?: {
        frontendFromURL?: string
        frontendFromFolder?: string
    }
}

export function createWindowManager(state: StateManager, options: WindowManagerOptions): WindowManager {
    let guideWindow: BrowserWindow | null = null
    let settingWindow: BrowserWindow | null = null

    function newBrowserWindow(hashURL: string, configure?: {
        titleBarStyle?: ('default' | 'hidden' | 'hiddenInset'),
        height?: number, width?: number
    }): BrowserWindow {
        const win = new BrowserWindow({
            title: 'Hedge',
            height: configure?.height ?? 720,
            width: configure?.width ?? 1080,
            minHeight: 480,
            minWidth: 640,
            titleBarStyle: configure?.titleBarStyle ?? "hiddenInset",
            webPreferences: {
                devTools: !!options.debug,
                enableRemoteModule: true,
                preload: path.join(__dirname, 'preloads/index.js')
            }
        })

        if(options.debug?.frontendFromURL) {
            win.loadURL(options.debug.frontendFromURL + (hashURL ? `#/${hashURL}` : '')).finally(() => {})
        }else if(options.debug?.frontendFromFolder) {
            win.loadFile(path.join(options.debug.frontendFromFolder, RESOURCE_FILE.FRONTEND.INDEX), {hash: hashURL}).finally(() => {})
        }else{
            win.loadFile(path.join(APP_FILE.FRONTEND_FOLDER, RESOURCE_FILE.FRONTEND.INDEX), {hash: hashURL}).finally(() => {})
        }
        return win
    }

    function createWindow(): BrowserWindow {
        if(!state.isLogin()) {
            //在未登录时，只允许开启一个主要窗口。开启第二窗口只会去唤醒已有窗口。
            for (let window of getAllWindows()) {
                if(window != guideWindow && window != settingWindow) {
                    window.show()
                    return window
                }
            }
        }
        return newBrowserWindow("")
    }

    function createDisplayWindow(/*content*/): BrowserWindow | null {
        if(!state.isLogin()) {
            return null
        }
        return newBrowserWindow("display")
    }

    function openSettingWindow(): BrowserWindow | null {
        if(!state.isLogin()) {
            return null
        }
        if(settingWindow == null) {
            settingWindow = newBrowserWindow('setting', {titleBarStyle: "hidden", width: 960})
            settingWindow.on("closed", () => {
                settingWindow = null
            })
        }else{
            settingWindow.show()
        }
        return settingWindow
    }

    function openGuideWindow(): BrowserWindow {
        if(guideWindow == null) {
            guideWindow = newBrowserWindow('guide', {titleBarStyle: "hidden", width: 960})
            guideWindow.on("closed", () => {
                guideWindow = null
            })
        }else{
            guideWindow.show()
        }
        return guideWindow
    }

    function getAllWindows(): BrowserWindow[] {
        return BrowserWindow.getAllWindows()
    }

    return {
        createWindow,
        createDisplayWindow,
        openGuideWindow,
        openSettingWindow,
        getAllWindows
    }
}
