import path from "path"
import { APP_DATA_DIM } from "../../definitions/file-dim"
import { mkdir, readFile, writeFile, exists } from "../../utils/fs"
import { AppData, defaultValue } from "./model"
import {migrate} from "./migrations";

/**
 * 连接到外部系统中，appData相关数据的模块。提供基本的对数据的存取功能，并定义了数据格式。
 * 相当于dao层。更多业务实现则需要service层。
 */
export interface AppDataDriver {
    /**
     * 判断本地文件系统上是否已存在初始化的文件。
     * 用于配合检查是否已经初始化存储。
     */
    isInitialized(): boolean
    /**
     * 判断内存数据是否已加载。
     */
    isLoaded(): boolean
    /**
     * 加载appData的数据到内存。这会从文件系统读取值。如果文件系统中的值不存在，那么会写入默认值再返回。
     */
    load(): Promise<AppData>
    /**
     * 取得appData的数据内容。需要在初始化之后再执行。
     * @return 返回AppData。
     */
    getAppData(): AppData
    /**
     * 保存appData的内容。需要在初始化之后再执行。
     * appData的内容使用全局共享的object。可以修改getAppData的结果，然后保存。
     * @param processData 提供此回调在保存之前做一次修改
     * @return 保存成功返回AppData内容，否则返回{null}表示appData不存在，无法执行保存(这也将不调用processData)。
     */
    saveAppData(processData?: (d: AppData) => void): Promise<AppData>
}

export interface AppDataDriverOptions {
    debugMode: boolean,
    appDataPath: string
}

export function createAppDataDriver(options: AppDataDriverOptions): AppDataDriver {
    const appDataFolder = path.join(options.appDataPath, APP_DATA_DIM.FOLDER)
    const appDataFilepath = path.join(appDataFolder, APP_DATA_DIM.MAIN_STORAGE)

    let appData: AppData | null = null

    function getAppData() {
        if(appData != null) {
            return appData
        }
        throw new Error("Appdata is not initialized.")
    }

    function isInitialized() {
        return appData != null ? true : exists(appDataFilepath)
    }

    function isLoaded() {
        return appData != null
    }

    async function saveAppData(processData?: (d: AppData) => void): Promise<AppData> {
        if(appData == null) {
            throw new Error("Appdata is not initialized.")
        }
        if(typeof processData === 'function') {
            processData(appData)
        }
        return await writeFile(appDataFilepath, appData)
    }

    async function load(): Promise<AppData> {
        if(appData == null) {
            if(isInitialized()) {
                appData = await readFile(appDataFilepath)
                if(appData == null) {
                    throw new Error("Appdata is not initialized.")
                }
            }else{
                await mkdir(appDataFolder)
                await writeFile(appDataFilepath, appData = defaultValue())
            }
            
            const { appData: newAppData, changed } = await migrate({appData})
            if(changed) {
                await writeFile(appDataFilepath, appData = newAppData)
            }
        }
        return appData
    }

    return {
        isInitialized,
        isLoaded,
        load,
        getAppData,
        saveAppData
    }
}
