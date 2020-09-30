import { exists, rmdir } from "../../utils/fs"
import { connectToConnection, createConnection, includeConnection, Connection, Schema } from "./connection"
import { AppDataDriver } from "../appdata"

/**
 * 连接到外部系统中，database相关的模块。提供对元数据、数据库的访问存取功能，定义了数据格式与migration。
 * 此driver提供对database对象的生成和管理服务，同时确保读写的安全性和唯一性等问题，即解决除业务逻辑之外的大多数问题。
 * 相当于dao层，更多业务实现则需要service层。
 * database driver的管理依赖app data。如果app data未初始化，此数据库的管理操作都将失败。
 */
export interface DatabaseDriver {
    /**
     * 获得当前连接。如果当前没有连接，返回{null}。
     */
    currentConnection(): Connection | null
    /**
     * 连接到指定的数据库。
     * @param path 数据库path
     * @return 返回连接得到的连接。如果目标数据库不存在或出现其他连接问题，返回{null}。
     */
    connect(path: string): Promise<Connection | null>
    /**
     * 断开当前数据库的连接。
     */
    disconnect(): Promise<void>
    /**
     * 列出系统下已注册的全部数据库。
     */
    listDatabases(): Promise<Schema[] | null>
    /**
     * 导入一个已存在的数据库。
     * @param path 此数据库的目录地址
     */
    include(path: string): Promise<boolean>
    /**
     * 根据参数，在目标位置创建一个新数据库。
     * @param options 数据库配置
     * @return 此数据库的连接。如果创建失败，或目标位置文件夹存在，返回{null}。
     */
    create(options: Schema): Promise<boolean>
    /**
     * 删除指定数据库。如果此数据库是当前正在使用的数据库，会自动断开连接。
     * @param path 数据库path
     * @param deleteFile 是否删除物理文件
     * @return 删除是否成功。
     */
    trash(path: string, deleteFile: boolean): Promise<boolean>
}

export interface DatabaseOptions {
    debugMode: boolean
    appDataPath: string
}

export function createDatabaseDriver(appDataDriver: AppDataDriver, options: DatabaseOptions): DatabaseDriver {
    let current: Connection | null = null

    function currentConnection() {
        return current
    }

    async function connect(path: string): Promise<Connection | null> {
        await disconnect()
        try {
            return current = await connectToConnection(path)
        }catch (e) {
            return null
        }
    }

    async function disconnect(): Promise<void> {
        if(current != null) {
            await current.close()
            current = null
        }
    }

    async function create(options: Schema): Promise<boolean> {
        if(!appDataDriver.isLoaded()) { return false }
        const appData = appDataDriver.getAppData()
        if(appData.databases.find(d => d.path === options.path) != null) { return false }
        try {
            current = await createConnection(options)
        }catch (e) {
            return false
        }
        await appDataDriver.saveAppData(appData => {
            appData.databases.push(options)
        })
        return true
    }

    async function include(path: string): Promise<boolean> {
        if(!appDataDriver.isLoaded()) { return false }
        const appData = appDataDriver.getAppData()
        if(appData.databases.find(d => d.path === path) != null) { return false }
        try {
            const schema = await includeConnection(path)
            if(schema == null) { return false }
            await appDataDriver.saveAppData(appData => {
                appData.databases.push(schema)
            })
        }catch (e) {
            return false
        }
        return true
    }

    async function trash(path: string, deleteFile: boolean): Promise<boolean> {
        if(!appDataDriver.isLoaded()) { return false }
        const appData = appDataDriver.getAppData()

        if(current != null && current.getPath() === path) {
            await disconnect()
        }

        const schemaIndex = appData.databases.findIndex(d => d.path === path)
        if(schemaIndex < 0) { return false }
        const [schema] = appData.databases.splice(schemaIndex, 1)
        await appDataDriver.saveAppData()

        if(deleteFile && exists(schema.path)) {
            await rmdir(schema.path)
        }

        return true
    }

    async function listDatabases(): Promise<Schema[] | null> {
        if(!appDataDriver.isLoaded()) { return null }
        const { databases } = await appDataDriver.getAppData()
        return databases
    }

    return {
        currentConnection,
        connect,
        disconnect,
        listDatabases,
        create,
        include,
        trash
    }
}
