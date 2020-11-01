import path from "path"
import { mkdir, readFile, writeFile } from "../../utils/fs"
import { DATA_FILE } from "../../definitions/file"
import { AppData, defaultValue } from "./model"
import { migrate } from "./migrations"

/**
 * 连接到指定频道的appdata数据。
 * 在频道不存在时，driver会检测并发现，并可以调用函数对其进行初始化。
 * 连接到数据后，允许对client范围内的数据进行读写操作。
 */
export interface AppDataDriver {
    /**
     * 在app的后初始化环节调用，异步地读取appdata的当前状况，并更新到状态。如果appdata可读，将加载数据到内存，并应用可能的更改。
     */
    load(): Promise<void>
    /**
     * 即时返回app内部的初始化状况。
     */
    status(): AppDataStatus
    /**
     * 在appdata没有初始化时可调用，对appdata进行初始化写入。
     */
    init(): Promise<void>
    /**
     * 获得appdata数据。
     */
    getAppData(): AppData
    /**
     * 保存appdata到文件。
     * @param process 在保存时顺手做一次修改。
     */
    saveAppData(process?: (data: AppData) => void): Promise<AppData>
}

enum AppDataStatus {
    UNKNOWN,
    NOT_INIT,
    LOADING,
    LOADED
}

/**
 * 构造参数。
 */
export interface AppDataDriverOptions {
    /**
     * app的数据目录。例如对于macOS，它是~/Library/Application Support/Hedge-v2目录。
     */
    userDataPath: string
    /**
     * app运行所在的频道名称。启动没有指定频道时，默认频道名为default。
     */
    channel: string
    /**
     * app是否以开发调试模式运行。
     */
    debugMode: boolean
}

export function createAppDataDriver(options: AppDataDriverOptions): AppDataDriver {
    const channelPath = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel))
    const clientDataPath = path.join(channelPath, DATA_FILE.APPDATA.CHANNEL.CLIENT_DATA)

    let status = AppDataStatus.UNKNOWN
    let appData: AppData | null = null

    async function load() {
        const data = await readFile<AppData>(clientDataPath)
        if(data != null) {
            status = AppDataStatus.LOADING

            const { appData: newAppData, changed } = await migrate({appData: data})
            if(changed) {
                await writeFile(clientDataPath, newAppData)
            }
            appData = newAppData

            status = AppDataStatus.LOADED
            console.log("[AppDataDriver] App data is loaded.")
        }else{
            status = AppDataStatus.NOT_INIT
            console.log("[AppDataDriver] App data is not init.")
        }
    }

    async function init() {
        if(status != AppDataStatus.NOT_INIT) {
            throw new Error("Appdata status must be NOT_INIT.")
        }
        status = AppDataStatus.LOADING

        await mkdir(channelPath)
        await writeFile(clientDataPath, appData = defaultValue())

        const { appData: newAppData, changed } = await migrate({appData})
        if(changed) {
            await writeFile(clientDataPath, appData = newAppData)
        }

        status = AppDataStatus.LOADED
    }

    async function saveAppData(process?: (data: AppData) => void) {
        if(appData == null) {
            throw new Error("AppData is not initialized.")
        }
        if(typeof process === 'function') {
            process(appData)
        }
        return await writeFile(clientDataPath, appData)
    }

    return {
        load,
        init,
        saveAppData,
        getAppData() {
            return appData!!
        },
        status() {
            return status
        }
    }
}
