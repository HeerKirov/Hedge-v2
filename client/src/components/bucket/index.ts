import path from "path"
import { readFile, writeFile } from "../../utils/fs"
import { DATA_FILE } from "../../definitions/file"

/**
 * 本地存储桶组件。它的用途是不过问存储内容，向client-ipc连接的前端提供在客户端环境下的localstorage服务，用于存储任何前端业务的持久存储内容。
 */
export interface Bucket {
    /**
     * 取得一个存储对象的文件对接器。
     */
    storage<T>(name: string): LocalStorage<T>
}

/**
 * 单个存储对象的操作对象。
 */
export interface LocalStorage<T> {
    read(): Promise<T | null>
    write(data: T): Promise<void>
}

/**
 * 启动参数。
 */
interface BucketOptions {
    userDataPath: string
    channel: string
}

export function createBucket(options: BucketOptions): Bucket {
    const storageDict: {[name: string]: LocalStorage<any>} = {}

    function createLocalStorage<T>(name: string): LocalStorage<T> {
        const filename = path.join(options.userDataPath, DATA_FILE.APPDATA.CHANNEL_FOLDER(options.channel), DATA_FILE.APPDATA.CHANNEL.CLIENT_STORAGE(name))

        return {
            async read(): Promise<T | null> {
                return await readFile<T>(filename)
            },
            async write(data: T): Promise<void> {
                await writeFile<T>(filename, data)
            }
        }
    }

    return {
        storage<T>(name: string): LocalStorage<T> {
            return storageDict[name] ?? (storageDict[name] = createLocalStorage<T>(name))
        }
    }
}
