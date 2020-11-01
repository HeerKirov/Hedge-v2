import { app, systemPreferences } from "electron"
import { getNodePlatform, Platform } from "../utils/process"
import { createWindowManager, WindowManager } from "./window-manager"
import { createAppDataDriver } from "../components/appdata"
import { createResourceManager } from "../components/resource-manager"
import {createBucket} from "../components/bucket";

/**
 * app的启动参数。
 */
export interface AppOptions {
    /**
     * app读取的数据频道。
     */
    channel?: string
    /**
     * app以开发调试模式启动。
     */
    debug?: DebugOption
}

/**
 * 以调试模式启动。在调试模式下，软件的配置尽量贴近开发环境并提供调试方法。
 * - 允许前端打开devtool调试。
 * - 使用开发模式的服务后台。
 * - 使用开发模式的前端。
 * - 将数据存放在本地目录下，隔离生产目录。
 */
interface DebugOption {
    /**
     * 本地的开发数据目录。此目录对应的是生产环境下的appData目录。
     */
    localDataPath?: string
    /**
     * 使用此URL提供的前端。此选项主要用于前端的业务开发。
     */
    frontendFromURL?: string
    /**
     * 使用此文件夹下的前端资源。此选项主要用于前端在生产模式下的调试。
     */
    frontendFromFolder?: string
    /**
     * 使用此URL提供的后台服务。此选项主要用于后台服务的业务开发。使用此选项时，后台服务的启动管理功能被禁用。
     */
    serverFromURL?: string
    /**
     * 使用此文件夹下的后台服务资源。此选项主要用于后台服务启动管理功能的调试。
     */
    serverFromFolder?: string
    /**
     * 使用此压缩包提供的后台服务资源。此选项主要用于后台服务解压同步功能的调试。
     */
    serverFromResource?: string
}

export function createApplication(options?: AppOptions) {
    const platform = getNodePlatform()
    const channel = options?.channel ?? "default"
    const userDataPath = options?.debug?.localDataPath ?? app.getPath("userData")

    const appDataDriver = createAppDataDriver({userDataPath, channel, debugMode: !!options?.debug})

    const resourceManager = createResourceManager({userDataPath, debug: options?.debug && {frontendFromFolder: options.debug.frontendFromFolder, serverFromResource: options.debug.serverFromResource}})

    const bucket = createBucket({userDataPath, channel})

    const windowManager = createWindowManager({platform, debug: options?.debug && {frontendFromFolder: options.debug.frontendFromFolder, frontendFromURL: options.debug.frontendFromURL}})

    registerAppEvents(windowManager, platform, options)

    app.whenReady().then(async () => {
        await appDataDriver.load()
        await resourceManager.load()

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
