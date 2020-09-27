import { BrowserWindow } from "electron"
import { Platform } from "../definitions"

const FRONTEND_INDEX_PATH = "../frontend/index.html"

export interface WindowManagerOptions {
    debugMode: boolean
    debugFrontendURL?: string
    debugFrontendFile?: string
    platform: Platform
}

export interface WindowManager {
    createWindow(): BrowserWindow
    createDisplayWindow(): BrowserWindow
    openGuideWindow(): BrowserWindow
    getAllWindows(): BrowserWindow[]
}

/**
 * 构造窗口管理器。
 * 窗口管理器将全权控制应用程序的窗口建立。
 * @param options
 */
export function createWindowManager(options: WindowManagerOptions): WindowManager {

    let guideWindow: BrowserWindow|null = null

    function newBrowserWindow(hashURL?: string): BrowserWindow {
        const win = new BrowserWindow({
            title: 'Hedge',
            height: 800,
            width: 1200,
            minHeight: 480,
            minWidth: 640,
            titleBarStyle: "hiddenInset",
            webPreferences: {
                devTools: options.debugMode,
                nodeIntegration: true,
                //preload: '' 注入启动脚本
            }
        })
        if(!options.debugMode) {
            win.loadFile(FRONTEND_INDEX_PATH, {hash: hashURL}).finally(() => {})
        }else if(options.debugFrontendURL) {
            win.loadURL(options.debugFrontendURL + (hashURL ? `#/${hashURL}` : '')).finally(() => {})
        }else if(options.debugFrontendFile) {
            win.loadFile(options.debugFrontendFile, {hash: hashURL}).finally(() => {})
        }else{
            throw new Error("No debug file or URL for window.")
        }
        return win
    }

    function createWindow(): BrowserWindow {
        return newBrowserWindow()
    }

    function createDisplayWindow(/*content*/): BrowserWindow {
        return newBrowserWindow()
    }

    function openGuideWindow(): BrowserWindow {
        if(guideWindow == null) {
            guideWindow = newBrowserWindow('guide')
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
        getAllWindows
    }
}
