import { shallowRef, Ref, watch } from "vue"
import { objects } from "@/utils/primitives"
import { createQueryEndpointInstance, QueryEndpointArguments, QueryEndpointInstance } from "./instance"

export interface QueryEndpointOptions<T, K> extends QueryEndpointArguments {
    /**
     * 响应式的查询条件对象。更新此对象会引发查询实例更换。
     */
    filter?: Ref<K>
    /**
     * 通过此函数回调数据源的查询结果。
     */
    request(offset: number, limit: number, filter: K): Promise<{ok: true, total: number, result: T[]} | {ok: false, message: string}>
}

export interface QueryEndpointResult<T> {
    /**
     * 代理实例。该对象的实现代理了真实对象，在只需要使用endpoint的API的情况下不需要手动处理instance更换引起的对象更替。
     */
    proxy: QueryEndpointInstance<T>
    /**
     * 当前响应式返回的实例。实例是浅响应的。
     */
    instance: Ref<QueryEndpointInstance<T>>
    /**
     * 刷新。这会强制销毁重建实例以重新请求所有数据。
     */
    refresh(): void
}

export function useQueryEndpoint<T, K = undefined>(options: QueryEndpointOptions<T, K>): QueryEndpointResult<T> {
    const createInstance = (filter: K | undefined) => {
        const filterClone = filter !== undefined ? objects.deepCopy(filter) : undefined
        return createQueryEndpointInstance({
            request: (offset, limit) => options.request(offset, limit, filterClone as K),
            handleError: options.handleError,
            segmentSize: options.segmentSize
        })
    }

    const instance: Ref<QueryEndpointInstance<T>> = shallowRef(createInstance(options.filter?.value))

    const refresh = () => instance.value = createInstance(options.filter?.value)

    if(options.filter !== undefined) watch(options.filter, filter => instance.value = createInstance(filter), {deep: true})

    const proxy: QueryEndpointInstance<T> = {
        queryOne: index => instance.value.queryOne(index),
        queryRange: (offset, limit) => instance.value.queryRange(offset, limit),
        queryList: indexList => instance.value.queryList(indexList),
        isRangeLoaded: (offset, limit) => instance.value.isRangeLoaded(offset, limit),
        count: () => instance.value.count(),
        syncOperations: {
            find: (condition, priorityRange) => instance.value.syncOperations.find(condition, priorityRange),
            retrieve: index => instance.value.syncOperations.retrieve(index),
            modify: (index, newData) => instance.value.syncOperations.modify(index, newData),
            remove: index => instance.value.syncOperations.remove(index)
        }
    }

    return {proxy, instance, refresh}
}
