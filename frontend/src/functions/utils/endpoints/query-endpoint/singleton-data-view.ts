import { ModifiedEvent, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint/instance"
import { createEmitter, Emitter } from "@/utils/emitter";

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
        /**
         * 变化事件。进行任意变更时，发送事件通知。
         */
        modified: Emitter<ModifiedEvent<T>>
    }
}

/**
 * 创建一个单数据代理。
 */
export function createProxySingleton<T>(instance: QueryEndpointInstance<T>, index: number): SingletonDataView<T> {
    const modified = createEmitter<ModifiedEvent<T>>()
    let enable = true
    return {
        async get() {
            if(!enable) return undefined
            return await instance.queryOne(index)
        },
        syncOperations: {
            modify(newData: T): boolean {
                if(!enable) return false
                const oldValue = instance.syncOperations.retrieve(index)!
                const ok = instance.syncOperations.modify(index, newData)
                if(ok) {
                    modified.emit({type: "modify", index, value: newData, oldValue})
                }
                return ok
            },
            remove(): boolean {
                if(!enable) return false
                enable = false
                const oldValue = instance.syncOperations.retrieve(index)!
                const ok = instance.syncOperations.remove(index)
                if(ok) {
                    modified.emit({type: "remove", index, oldValue})
                }
                return ok
            },
            modified
        }
    }
}

/**
 * 创建一个无代理的、仅单一数据的实例。
 */
export function createStandaloneSingleton<T>(d: T): SingletonDataView<T> {
    const modified = createEmitter<ModifiedEvent<T>>()
    let data: T | undefined = d
    return {
        async get() {
            return data
        },
        syncOperations: {
            modify(newData: T): boolean {
                if(data !== undefined) {
                    const oldValue = data
                    data = newData
                    modified.emit({type: "modify", index: -1, value: data, oldValue})
                    return true
                }
                return false
            },
            remove(): boolean {
                if(data !== undefined) {
                    const oldValue = data
                    data = undefined
                    modified.emit({type: "remove", index: -1, oldValue})
                    return true
                }
                return false
            },
            modified
        }
    }
}

/**
 * 创建一个无代理的、仅单一数据的实例，不过数据通过异步函数请求取得。
 */
export function createInvokeSingleton<T>(invoke: () => Promise<T | undefined>): SingletonDataView<T> {
    const modified = createEmitter<ModifiedEvent<T>>()
    let invoked = false
    let data: T | undefined = undefined
    return {
        async get() {
            if(!invoked) {
                invoked = true
                data = await invoke()
            }
            return data
        },
        syncOperations: {
            modify(newData: T): boolean {
                if(data !== undefined) {
                    const oldValue = data
                    data = newData
                    modified.emit({type: "modify", index: -1, value: data, oldValue})
                    return true
                }
                return false
            },
            remove(): boolean {
                if(data !== undefined) {
                    const oldValue = data
                    data = undefined
                    modified.emit({type: "remove", index: -1, oldValue})
                    return true
                }
                return false
            },
            modified
        }
    }
}
