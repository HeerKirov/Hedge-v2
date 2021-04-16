import path from "path"
import { DATA_FILE } from "../../definitions/file"
import { readFile, writeFile } from "../../utils/fs"
import { ClientException } from "../../exceptions"
import { Configuration } from "./model"

/**
 * 连接到指定频道的public data。
 */
export interface ConfigurationDriver {
    /**
     * 在app的后初始化环节调用，异步地读取public configuration的当前内容。如果数据不存在，会把将状态标记为NOT_INIT。
     */
    load(): Promise<void>
    /**
     * 当前加载状态。
     */
    status(): ConfigurationStatus
    /**
     * 获取数据。
     */
    getData(): Configuration | null
    /**
     * 保存数据到文件。
     */
    saveData(process?: (data: Configuration) => void): Promise<Configuration>
}

export enum ConfigurationStatus {
    UNKNOWN = "UNKNOWN",
    NOT_INIT = "NOT_INIT",
    LOADING = "LOADING",
    LOADED = "LOADED"
}

export interface ConfigurationDriverOptions {
    /**
     * app的数据目录。例如对于macOS，它是~/Library/Application Support/Hedge-v2目录。
     */
    userDataPath: string
    /**
     * app运行所在的频道名称。启动没有指定频道时，默认频道名为default。
     */
    channel: string
}

export function createConfigurationDriver(options: ConfigurationDriverOptions): ConfigurationDriver {
    const channelPath = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel))
    const publicDataPath = path.join(channelPath, DATA_FILE.APPDATA.CHANNEL.PUBLIC_DATA)

    let status = ConfigurationStatus.UNKNOWN
    let publicData: Configuration | null = null

    async function load() {
        try {
            status = ConfigurationStatus.LOADING
            const data = await readFile<Configuration>(publicDataPath)
            if(data != null) {
                publicData = data
                status = ConfigurationStatus.LOADED
                console.log("[ConfigurationDriver] Public data is loaded.")
            }else{
                status = ConfigurationStatus.NOT_INIT
                console.log("[ConfigurationDriver] Public data is not init.")
            }
        }catch (e) {
            throw new ClientException("CONFIGURATION_LOAD_ERROR", e)
        }
    }

    async function saveData(process?: (data: Configuration) => void): Promise<Configuration> {
        if(publicData == null) {
            publicData = {
                dbPath: ""
            }
        }
        if(typeof process === "function") {
            process(publicData)
        }
        return await writeFile(publicDataPath, publicData)
    }

    return {
        load,
        saveData,
        getData() {
            return publicData
        },
        status() {
            return status
        }
    }
}
