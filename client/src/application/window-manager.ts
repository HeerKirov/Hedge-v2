import { BrowserWindow } from "electron"
import { FRONTEND_INDEX_DIM } from "../definitions/file-dim"
import { Platform } from "../utils/process"

export interface WindowManagerOptions {
    debugMode: boolean
    debugFrontendURL?: string
    platform: Platform
}

export interface WindowManager {
    /**
     * 创建一个承载一般业务的普通窗口。
     */
    createWindow(): BrowserWindow
    /**
     * 创建一个轮播图片专用的窗口。
     */
    createDisplayWindow(/*content*/): BrowserWindow
    /**
     * 打开guide窗口。
     */
    openGuideWindow(): BrowserWindow
    /**
     * 打开设置窗口。
     */
    openSettingWindow(): BrowserWindow
    /**
     * 获得全部窗口列表。
     */
    getAllWindows(): BrowserWindow[]
}

/**
 * 构造窗口管理器。
 * 窗口管理器将全权控制应用程序的窗口建立。
 * @param options
 */
export function createWindowManager(options: WindowManagerOptions): WindowManager {

    let guideWindow: BrowserWindow | null = null
    let settingWindow: BrowserWindow | null = null

    function newBrowserWindow(hashURL: string, configure?: {
        title?: string,
        titleBarStyle?: ('default' | 'hidden' | 'hiddenInset')
    }): BrowserWindow {
        const win = new BrowserWindow({
            title: configure?.title ?? 'Hedge',
            height: 720,
            width: 1200,
            minHeight: 480,
            minWidth: 672,
            titleBarStyle: configure?.titleBarStyle ?? "hiddenInset",
            webPreferences: {
                devTools: options.debugMode,
                nodeIntegration: true,
                //preload: '' 注入启动脚本
            }
        })
        if(options.debugMode && options.debugFrontendURL) {
            win.loadURL(options.debugFrontendURL + (hashURL ? `#/${hashURL}` : '')).finally(() => {})
        }else{
            win.loadFile(FRONTEND_INDEX_DIM, {hash: hashURL}).finally(() => {})
        }
        return win
    }

    function createWindow(): BrowserWindow {
        return newBrowserWindow("hedge/images")
    }

    function createDisplayWindow(/*content*/): BrowserWindow {
        return newBrowserWindow("display")
    }

    function openSettingWindow(): BrowserWindow {
        if(settingWindow == null) {
            settingWindow = newBrowserWindow('setting', {title: "设置", titleBarStyle: "hidden"})
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
            guideWindow = newBrowserWindow('guide', {title: "向导", titleBarStyle: "hidden"})
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
