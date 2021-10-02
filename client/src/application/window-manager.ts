import * as path from "path"
import { BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import { Platform } from "../utils/process"
import { State, StateManager } from "../components/state"
import { APP_FILE, RESOURCE_FILE } from "../definitions/file"
import { registerIpcRemoteEvent } from "./ipc-transformer"
import { ThemeManager } from "./theme-manager"

/**
 * electron的窗口管理器。管控窗口的建立。
 * 窗口管理器会区分不同业务的窗口。
 */
export interface WindowManager {
    /**
     * 初始化加载。并没有什么业务要加载，主要是告知window manager程序已经可用。
     */
    load(): void
    /**
     * 创建一个承载一般业务的普通窗口。
     */
    createWindow(url?: string): BrowserWindow | null
    /**
     * 打开guide窗口。
     */
    openGuideWindow(): BrowserWindow | null
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

export function createWindowManager(state: StateManager, theme: ThemeManager, options: WindowManagerOptions): WindowManager {
    let ready = false
    let guideWindow: BrowserWindow | null = null
    let settingWindow: BrowserWindow | null = null

    function newBrowserWindow(hashURL: string, configure: BrowserWindowConstructorOptions = {}): BrowserWindow {
        const win = new BrowserWindow({
            title: 'Hedge',
            height: 720,
            width: 1080,
            minHeight: 480,
            minWidth: 640,
            titleBarStyle: "hiddenInset",
            webPreferences: {
                devTools: !!options.debug,
                preload: path.join(__dirname, 'preloads/index.js')
            },
            backgroundColor: theme.getRuntimeTheme() === "dark" ? "#212121" : "#FFFFFF",
            ...configure
        })

        registerIpcRemoteEvent(win)

        if(options.debug?.frontendFromURL) {
            win.loadURL(options.debug.frontendFromURL + (hashURL ? `#${hashURL}` : '')).finally(() => {})
        }else if(options.debug?.frontendFromFolder) {
            win.loadFile(path.join(options.debug.frontendFromFolder, RESOURCE_FILE.FRONTEND.INDEX), {hash: hashURL}).finally(() => {})
        }else{
            win.loadFile(path.join(APP_FILE.FRONTEND_FOLDER, RESOURCE_FILE.FRONTEND.INDEX), {hash: hashURL}).finally(() => {})
        }
        return win
    }

    function load() {
        //在load之前，禁止通过任何方式打开窗口，防止在loaded之前的意外的前端加载。
        ready = true
    }

    function createWindow(url?: string): BrowserWindow | null {
        if(!ready || state.state() !== State.LOADED) {
            //在未登录时，只允许开启一个主要窗口。开启第二窗口只会去唤醒已有窗口。
            for (let window of getAllWindows()) {
                if(window != guideWindow && window != settingWindow) {
                    window.show()
                    return window
                }
            }
        }
        if(url) {
            return newBrowserWindow(url)
        }
        return newBrowserWindow("")
    }

    function openSettingWindow(): BrowserWindow | null {
        if(!ready || state.state() !== State.LOADED) {
            return null
        }
        if(settingWindow == null) {
            settingWindow = newBrowserWindow('/setting', {titleBarStyle: "hidden", width: 820, height: 640, fullscreenable: false})
            settingWindow.on("closed", () => {
                settingWindow = null
            })
        }else{
            settingWindow.show()
        }
        return settingWindow
    }

    function openGuideWindow(): BrowserWindow | null {
        if(!ready) {
            return null
        }
        if(guideWindow == null) {
            guideWindow = newBrowserWindow('/guide', {titleBarStyle: "hidden", width: 875})
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
        load,
        createWindow,
        openGuideWindow,
        openSettingWindow,
        getAllWindows
    }
}
