import { QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint/instance"

/**
 * 一个单个数据的代理实例，和slice类似，不过它只代理单个数据记录。
 */
export interface SingletonDataView<T> {
    /**
     * 取得记录的值。
     */
    get(): Promise<T | undefined>
    syncOperations: {
        /**
         * 替换此记录的数据值。
         */
        modify(newData: T): boolean
        /**
         * 从数据列表中删除此记录。
         * 记录删除后，此代理实例将无效化，get返回undefined。
         */
        remove(): boolean
    }
}

/**
 * 创建一个单数据代理。
 */
export function createSingletonOfOne<T>(instance: QueryEndpointInstance<T>, index: number): SingletonDataView<T> {
    let enable = true
    return {
        async get() {
            if(!enable) return undefined
            return await instance.queryOne(index)
        },
        syncOperations: {
            modify(newData: T): boolean {
                if(!enable) return false
                return instance.syncOperations.modify(index, newData)
            },
            remove(): boolean {
                if(!enable) return false
                enable = false
                return instance.syncOperations.remove(index)
            }
        }
    }
}
