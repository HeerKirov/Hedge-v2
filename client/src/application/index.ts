import { app, systemPreferences } from "electron"
import { getElectronPlatform, Platform } from "../utils/process"
import { createWindowManager, WindowManager } from "./window-manager"
import { createAppDataDriver, AppDataDriver } from "../components/appdata"
import { createDatabaseDriver, DatabaseDriver } from "../components/database"
import { createWebServer, createWebServerProxy } from "../components/web-server"
import { createIpcTransformer } from "./ipc-transformer"
import { createService } from "../service"

export interface AppOptions {
    /**
     * 以调试模式启动。调试模式下，软件使用的配置尽量贴近开发环境。
     * - 使用的前端将优先考虑{debugFrontendURL}或{debugFrontendIndex}提供的内容。
     * - 使用的后端将优先考虑{debugServerTarget}提供的内容。
     */
    debugMode?: boolean
    /**
     * 提供一个URL，直接从此URL中获得前端内容。方便与开发环境连接。
     */
    debugFrontendURL?: string
    /**
     * 提供一个dist目录，从此目录中获得前端资源文件。主要是为了web server的前端调试。
     */
    debugFrontendDist?: string
    /**
     * 提供一个文件夹路径，在调试模式下所有数据都放在这里，与生产环境隔离。
     */
    debugAppDataFolder?: string
}

export function createApplication(options?: AppOptions) {
    const platform = getElectronPlatform()
    const debugMode = options?.debugMode ?? false
    const appDataPath = options?.debugMode && options?.debugAppDataFolder ? options.debugAppDataFolder : app.getPath("userData")

    const appDataDriver = createAppDataDriver({debugMode, appDataPath})

    const dbDriver = createDatabaseDriver(appDataDriver, {debugMode, appDataPath})

    const windowManager = createWindowManager({debugFrontendURL: options?.debugFrontendURL, debugMode, platform})

    const webServerProxy = createWebServerProxy()

    const service = createService(appDataDriver, dbDriver, webServerProxy, windowManager, {debugMode, platform})

    webServerProxy.proxy(createWebServer(service, appDataDriver, {debugMode, platform, appDataPath, debugFrontendDist: options?.debugFrontendDist}))

    createIpcTransformer(service, {debugMode, platform, appDataPath})

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

async function test(appDataDriver: AppDataDriver, dbDriver: DatabaseDriver, appDataPath: string) {
    console.log("[Test]")
    console.log(`appData.isInitialized=${appDataDriver.isInitialized()}`)
    console.log(`appData.isLoaded=${appDataDriver.isLoaded()}`)
    console.log(`appData: ${await appDataDriver.load()}`)
    console.log(`db.list=${await dbDriver.listDatabases()}`)
    console.log(`db.newDatabase=${await dbDriver.create({name: "test", description: "...", path: `${appDataPath}/default`})}`)
    console.log(`db.connect=${await dbDriver.connect(`${appDataPath}/default`)}`)
}
