import path from "path"
import { DATA_FILE } from "../../definitions/file"
import { readFile, writeFile } from "../../utils/fs"
import { ClientException } from "../../exceptions"
import { Configuration, ConfigurationModel, DbPath } from "./model"

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
    /**
     * 取得转换后的实际dbPath位置。
     */
    getActualDbPath(): string | null
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
            const data = await readFile<ConfigurationModel>(publicDataPath)
            if(data != null) {
                publicData = mapFromModel(data)
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
                dbPath: {
                    type: "channel",
                    path: "default"
                }
            }
        }
        if(typeof process === "function") {
            process(publicData)
        }
        status = ConfigurationStatus.LOADED
        await writeFile(publicDataPath, mapToModel(publicData))
        return publicData
    }

    return {
        load,
        saveData,
        getData() {
            return publicData
        },
        status() {
            return status
        },
        getActualDbPath() {
            if(publicData != null) {
                if(publicData.dbPath.type === "channel") {
                    return `${channelPath}/${publicData.dbPath.path}`
                }else{
                    return publicData.dbPath.path
                }
            }
            return null
        }
    }
}

function mapFromModel(model: ConfigurationModel): Configuration {
    return {
        dbPath: mapDbPathFromModel(model.dbPath)
    }
}

function mapToModel(configuration: Configuration): ConfigurationModel {
    return {
        dbPath: mapDbPathToModel(configuration.dbPath)
    }
}

function mapDbPathFromModel(dbPath: string): DbPath {
    if(dbPath.startsWith("@/")) {
        return {
            type: "channel",
            path: dbPath.substring(2),
        }
    }else{
        return {
            type: "absolute",
            path: dbPath
        }
    }
}

function mapDbPathToModel(dbPath: DbPath): string {
    if(dbPath.type === "channel") {
        return `@/${dbPath.path}`
    }else{
        return dbPath.path
    }
}