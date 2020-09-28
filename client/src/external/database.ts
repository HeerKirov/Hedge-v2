import path from "path"
import { Database as sqlite3Driver } from "sqlite3"
import * as sqlite from "sqlite"
import { existsSync } from "fs"
import { APP_DATA_DIM } from "../definitions"
import { mkdir, readFile, writeFile } from "../utils/fs"

/**
 * 连接到外部系统中，database相关的模块。提供对元数据、数据库的访问存取功能，定义了数据格式与migration。
 * 此driver提供对database的单例访问，同时确保读写的安全性和唯一性等问题，即解决除业务逻辑之外的大多数问题。
 * 相当于dao层，更多业务实现则需要service层。
 */
export interface DatabaseDriver {

}

export interface DatabaseOptions {
    debugMode: boolean
    appDataPath: string
}

export function createDatabaseDriver(options: DatabaseOptions): DatabaseDriver {

    return {}
}
