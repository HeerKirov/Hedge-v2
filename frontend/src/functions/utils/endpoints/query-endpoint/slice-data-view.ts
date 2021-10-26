import { ModifiedEvent, QueryEndpointInstance } from "./instance"
import { createEmitter, Emitter } from "@/utils/emitter";

/**
 * 一个queryInstance的代理切片，根据规则从实例中映射出一些数据项，并把一些操作映射回原实例。
 */
export interface SliceDataView<T> {
    /**
     * 查询指定单条数据。
     * 优先从缓存取数据，如果没有缓存，则会立刻加载segment。
     * @return 返回此记录。如果没有找到此记录，返回undefined
     */
    get(index: number): Promise<T | undefined>
    /**
     * 获得数据总量。只有在至少执行了一次查询后，才能获得总量，否则将返回undefined。
     */
    count(): number
    syncOperations: {
        /**
         * 替换数据列表中指定位置处的项。
         * @return 是否成功替换
         */
        modify(index: number, newData: T): boolean
        /**
         * 从数据列表中删除指定位置处的项。后面的项会前移一位。
         * 如果后一个段是not loaded的段，会导致当前段会被重新标记为not loaded，使其重新加载数据。
         * @return 是否成功删除
         */
        remove(index: number): boolean
        /**
         * 变化事件。进行任意变更时，发送事件通知。
         */
        modified: Emitter<ModifiedEvent<T>>
    }
}

export function createSliceOfAll<T, R>(instance: QueryEndpointInstance<T>, mapper: Mapper<T, R>): SliceDataView<R>;
export function createSliceOfAll<T>(instance: QueryEndpointInstance<T>): SliceDataView<T>;

/**
 * 创建一个instance的完全切片，相当于代理。
 */
export function createSliceOfAll<T, R = T>(instance: QueryEndpointInstance<T>, mapper?: Mapper<T, R>): SliceDataView<R> {
    if(mapper !== undefined) {
        const modified = createEmitter<ModifiedEvent<R>>()
        return {
            async get(index) {
                const v = await instance.queryOne(index)
                return v && mapper.to(v)
            },
            count: () => instance.count()!,
            syncOperations: {
                modify(index, newData) {
                    const oldValue = instance.syncOperations.retrieve(index)!
                    const ret = instance.syncOperations.modify(index, mapper.from(newData))
                    if(ret) {
                        modified.emit({type: "modify", index, value: newData, oldValue: mapper.to(oldValue)})
                    }
                    return ret
                },
                remove(index) {
                    const oldValue = instance.syncOperations.retrieve(index)!
                    const ret = instance.syncOperations.remove(index)
                    if(ret) {
                        modified.emit({type: "remove", index, oldValue: mapper.to(oldValue)})
                    }
                    return ret
                },
                modified
            }
        }
    }else{
        return {
            get: instance.queryOne,
            count: () => instance.count()!,
            syncOperations: {
                modify: instance.syncOperations.modify,
                remove: instance.syncOperations.remove,
                modified: instance.syncOperations.modified
            }
        } as any as SliceDataView<R>
    }
}

export function createSliceOfList<T, R>(instance: QueryEndpointInstance<T>, indexList: number[], mapper: Mapper<T, R>): SliceDataView<R>;
export function createSliceOfList<T>(instance: QueryEndpointInstance<T>, indexList: number[]): SliceDataView<T>;

/**
 * 创建一个instance中，根据index列表得到的切片。
 * 这种模式下，对slice中item的修改会确切反映到instance中。modify会更新，remove会移除。
 */
export function createSliceOfList<T, R = T>(instance: QueryEndpointInstance<T>, indexList: number[], mapper?: Mapper<T, R>): SliceDataView<R> {
    let indexes = [...indexList]
    if(mapper !== undefined) {
        const modified = createEmitter<ModifiedEvent<R>>()

        return {
            async get(index: number): Promise<R | undefined> {
                if(index < 0 || index >= indexes.length) {
                    return undefined
                }
                const v = await instance.queryOne(indexes[index])
                return v && mapper.to(v)
            },
            count(): number {
                return indexes.length
            },
            syncOperations: {
                modify(index: number, newData: R): boolean {
                    if(index < 0 || index >= indexes.length) {
                        return false
                    }
                    const oldValue = instance.syncOperations.retrieve(indexes[index])!
                    const ret = instance.syncOperations.modify(indexes[index], mapper.from(newData))
                    if(ret) {
                        modified.emit({type: "modify", index, value: newData, oldValue: mapper.to(oldValue)})
                    }
                    return ret
                },
                remove(index: number): boolean {
                    if(index < 0 || index >= indexes.length) {
                        return false
                    }
                    const i = indexes[index]
                    const oldValue = instance.syncOperations.retrieve(indexes[index])!
                    const ret = instance.syncOperations.remove(i)
                    if(ret) {
                        //成功删除时，从列表中移除此index的引用，并将在这之后的index的值降1
                        indexes = [...indexes.slice(0, index).map(j => j >= i ? j - 1 : j), ...indexes.slice(index + 1).map(j => j >= i ? j - 1 : j)]
                        modified.emit({type: "remove", index, oldValue: mapper.to(oldValue)})
                    }
                    return ret
                },
                modified
            }
        }
    }else{
        const modified = createEmitter<ModifiedEvent<T>>()

        return {
            async get(index: number): Promise<T | undefined> {
                if(index < 0 || index >= indexes.length) {
                    return undefined
                }
                return await instance.queryOne(indexes[index])
            },
            count(): number {
                return indexes.length
            },
            syncOperations: {
                modify(index: number, newData: T): boolean {
                    if(index < 0 || index >= indexes.length) {
                        return false
                    }
                    const oldValue = instance.syncOperations.retrieve(indexes[index])!
                    const ret = instance.syncOperations.modify(indexes[index], newData)
                    if(ret) {
                        modified.emit({type: "modify", index, value: newData, oldValue})
                    }
                    return ret
                },
                remove(index: number): boolean {
                    if(index < 0 || index >= indexes.length) {
                        return false
                    }
                    const i = indexes[index]
                    const oldValue = instance.syncOperations.retrieve(indexes[index])!
                    const ret = instance.syncOperations.remove(i)
                    if(ret) {
                        //成功删除时，从列表中移除此index的引用，并将在这之后的index的值降1
                        indexes = [...indexes.slice(0, index).map(j => j >= i ? j - 1 : j), ...indexes.slice(index + 1).map(j => j >= i ? j - 1 : j)]
                        modified.emit({type: "remove", index, oldValue})
                    }
                    return ret
                },
                modified
            }
        } as any as SliceDataView<R>
    }
}

interface Mapper<T, R> {
    to(t: T): R
    from(r: R): T
}
