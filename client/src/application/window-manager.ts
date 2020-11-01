import * as path from "path"
import { Platform } from "../utils/process"
import { BrowserWindow } from "electron"
import {APP_FILE, RESOURCE_FILE} from "../definitions/file"

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

export interface WindowManagerOptions {
    platform: Platform
    debug?: {
        frontendFromURL?: string
        frontendFromFolder?: string
    }
}

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
                devTools: !!options.debug,
                nodeIntegration: true,
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
