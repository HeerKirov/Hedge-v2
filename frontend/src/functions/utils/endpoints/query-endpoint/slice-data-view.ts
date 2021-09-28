import { QueryEndpointInstance } from "./instance"

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
    }
}

/**
 * 创建一个instance的完全切片，相当于代理。
 */
export function createSliceOfAll<T>(instance: QueryEndpointInstance<T>): SliceDataView<T> {
    return {
        get: instance.queryOne,
        count: () => instance.count()!,
        syncOperations: {
            modify: instance.syncOperations.modify,
            remove: instance.syncOperations.remove
        }
    }
}

/**
 * 创建一个instance中，根据index列表得到的切片。
 * 这种模式下，对slice中item的修改会确切反映到instance中。modify会更新，remove会移除。
 */
export function createSliceOfList<T>(instance: QueryEndpointInstance<T>, indexList: number[]): SliceDataView<T> {
    let indexes = [...indexList]

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
                return instance.syncOperations.modify(indexes[index], newData)
            },
            remove(index: number): boolean {
                if(index < 0 || index >= indexes.length) {
                    return false
                }
                const i = indexes[index]
                const ret = instance.syncOperations.remove(i)
                if(ret) {
                    //成功删除时，从列表中移除此index的引用，并将在这之后的index的值降1
                    indexes = [...indexes.slice(0, index).map(j => j >= i ? j - 1 : j), ...indexes.slice(index + 1).map(j => j >= i ? j - 1 : j)]
                }
                return ret
            }
        }
    }
}
