import path from "path"
import { APP_DATA_DIM } from "../../definitions/file-dim"
import { mkdir, readFile, writeFile } from "../../utils/fs"
import { AppData, defaultValue } from "./model"

/**
 * 连接到外部系统中，appData相关数据的模块。提供基本的对数据的存取功能，并定义了数据格式。
 * 相当于dao层。更多业务实现则需要service层。
 */
export interface AppDataDriver {
    /**
     * 判断本地appData是否存在。
     * 这实际上是getAppData() != null的包装。
     */
    exists(): Promise<boolean>
    /**
     * 取得appData的数据内容。
     * 这是一个异步方法和懒加载方法。第一次请求时，才会从文件读取配置。
     * @return 返回AppData，或返回{null}表示本地appData不存在。
     */
    getAppData(): Promise<AppData | null>
    /**
     * 保存appData的内容。
     * appData的内容使用全局共享的object。可以修改getAppData的结果，然后保存。
     * @param processData 提供此回调在保存之前做一次修改
     * @return 保存成功返回AppData内容，否则返回{null}表示appData不存在，无法执行保存(这也将不调用processData)。
     */
    saveAppData(processData?: (d: AppData) => void): Promise<AppData | null>
    /**
     * 对appData进行初始化。
     * 只能在appData不存在时执行。执行后立刻将默认值写入本地文件，然后返回数据内容。
     */
    initialize(): Promise<AppData>
}

export interface AppDataDriverOptions {
    debugMode: boolean,
    appDataPath: string
}

export function createAppDataDriver(options: AppDataDriverOptions): AppDataDriver {
    const appDataFolder = path.join(options.appDataPath, APP_DATA_DIM.FOLDER)
    const appDataFilepath = path.join(appDataFolder, APP_DATA_DIM.MAIN_STORAGE)

    let appData: AppData | null | undefined = undefined

    async function getAppData(): Promise<AppData | null> {
        if(appData !== undefined) {
            return Promise.resolve<AppData | null>(appData)
        }
        return appData = await readFile<AppData>(appDataFilepath)
    }

    async function exists(): Promise<boolean> {
        return await getAppData() != null
    }

    async function saveAppData(processData?: (d: AppData) => void): Promise<AppData | null> {
        if(appData == null) {
            return Promise.resolve(null)
        }
        if(typeof processData === 'function') {
            processData(appData)
        }
        return await writeFile(appDataFilepath, appData)
    }

    async function initialize(): Promise<AppData> {
        const currentAppData = await getAppData()
        if(currentAppData != null) {
            return Promise.resolve(currentAppData)
        }

        await mkdir(appDataFolder)

        return await writeFile(appDataFilepath, appData = defaultValue())
    }

    return {
        exists,
        initialize,
        getAppData,
        saveAppData
    }
}
