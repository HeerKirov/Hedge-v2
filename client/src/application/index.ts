import { app } from "electron"
import { getElectronPlatform, Platform } from "../definitions"
import { createWindowManager, WindowManager } from "./window-manager"
import { createAppDataDriver } from "../appdata"

export interface AppOptions {
    debugMode?: boolean
    debugFrontendURL?: string
    debugFrontendFile?: string
}

export function createApplication(options?: AppOptions) {
    const platform = getElectronPlatform()

    const windowManager = createWindowManager({
        debugMode: options?.debugMode ?? false,
        debugFrontendFile: options?.debugFrontendFile,
        debugFrontendURL: options?.debugFrontendURL,
        platform
    })

    const appDataDriver = createAppDataDriver()

    registerAppEvents(windowManager, platform, options)

    app.whenReady().then(() => {
        windowManager.createWindow()
    })
}

function registerAppEvents(windowManager: WindowManager, platform: Platform, options?: AppOptions) {
    app.on('window-all-closed', () => {
        if (platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        if (windowManager.getAllWindows().length === 0) {
            windowManager.createWindow()
        }
    })
}

