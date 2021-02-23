import { app } from "electron"
import { promiseAll, getNodePlatform, Platform } from "../utils/process"
import { createWindowManager, WindowManager } from "./window-manager"
import { createAppDataDriver } from "../components/appdata"
import { createStateManager } from "../components/state"
import { createChannel } from "../components/channel"
import { createResourceManager } from "../components/resource"
import { createServerManager, ServerManager, ServerStatus } from "../components/server"
import { createService } from "../components/service"
import { registerIpcTransformer } from "./ipc-transformer"
import { registerAppMenu } from "./menu"
import { registerDockMenu } from "./dock"
import { createThemeManager } from "./theme-manager"
import { panic } from "../exceptions"

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

export async function createApplication(options?: AppOptions) {
    const platform = getNodePlatform()
    const debugMode = !!options?.debug
    const appPath = app.getAppPath()
    const userDataPath = options?.debug?.localDataPath ?? app.getPath("userData")

    try {
        const channelManager = await createChannel({userDataPath, defaultChannel: "default", manualChannel: options?.channel})

        const appDataDriver = createAppDataDriver({userDataPath, debugMode, channel: channelManager.currentChannel()})

        const resourceManager = createResourceManager({userDataPath, appPath, debug: options?.debug && {frontendFromFolder: options.debug.frontendFromFolder, serverFromResource: options.debug.serverFromResource}})

        const serverManager = createServerManager({userDataPath, channel: channelManager.currentChannel(), debug: options?.debug && {serverFromURL: options.debug.serverFromURL, serverFromFolder: options.debug.serverFromFolder, frontendFromFolder: options.debug.frontendFromFolder}})

        const stateManager = createStateManager(appDataDriver, resourceManager, serverManager, {debugMode})

        const windowManager = createWindowManager(stateManager, {platform, debug: options?.debug && {frontendFromFolder: options.debug.frontendFromFolder, frontendFromURL: options.debug.frontendFromURL}})

        const themeManager = createThemeManager(appDataDriver)

        const service = createService(appDataDriver, channelManager, resourceManager, serverManager, stateManager, windowManager, themeManager, {debugMode, userDataPath, platform, channel: channelManager.currentChannel()})

        registerAppEvents(windowManager, serverManager, platform)
        registerIpcTransformer(service)

        await promiseAll(appDataDriver.load(), resourceManager.load(), app.whenReady())
        await themeManager.load()

        stateManager.load()

        registerAppMenu(windowManager, {debugMode, platform})
        registerDockMenu(windowManager)

        windowManager.load()
        windowManager.createWindow()
    } catch (e) {
        panic(e, debugMode)
    }
}

function registerAppEvents(windowManager: WindowManager, serverManager: ServerManager, platform: Platform) {
    app.on('activate', () => {
        if (windowManager.getAllWindows().length === 0) {
            windowManager.createWindow()
        }
    })

    app.on('window-all-closed', () => {
        if (platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('quit', () => {
        //此事件实际上将同步完成，在同步执行完成后app就已经退出，等不到异步返回
        if(serverManager.status() == ServerStatus.OPEN) {
            serverManager.closeConnection().finally(() => {})
        }
    })
}
