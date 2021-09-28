import { Ref, shallowRef, watch } from "vue"
import { useListeningEvent } from "@/functions/utils/emitter"
import { QueryEndpointResult } from "./query-endpoint"
import { LoadedStatus, QueryEndpointInstance } from "./instance"

export interface PaginationOptions {
    /**
     * 执行查询的延时。请求未加载的新数据会延迟一定时间，确保没有新的请求冲刷时才会确认执行。
     * 没有任何数据时，初次请求不会延时。
     */
    queryDelay?: number
}

/**
 * 对接于虚拟视图的分页视图，依据提出的数据更新请求，从queryEndpoint中获得查询结果。
 */
export interface PaginationDataView<T> {
    /**
     * 响应式返回的数据结果。
     */
    data: Ref<PaginationData<T>>
    /**
     * 提出数据更新。
     */
    dataUpdate(offset: number, limit: number): void
    /**
     * 重新请求数据。这并不会使底层重新请求数据，如有需要，从query endpoint调用refresh。
     */
    reset(): void
    /**
     * 代理instance实例。与query endpoint的代理一致，不过此处的find方法会自动使用data的值作为优化项。
     */
    proxy: QueryEndpointInstance<T>
}

export interface PaginationData<T> {
    metrics: {total: number | undefined, offset: number, limit: number}
    result: T[]
}

export function usePaginationDataView<T>(endpoint: QueryEndpointResult<T>, options?: PaginationOptions): PaginationDataView<T> {
    const queryDelay = options?.queryDelay ?? 250

    const data: Ref<PaginationData<T>> = shallowRef({
        metrics: {total: undefined, offset: 0, limit: 0},
        result: []
    })

    let currentQueryId = 0
    let lastDataUpdateParams: {offset: number, limit: number} | null = null
    let cacheTimer: number | null = null

    const dataUpdate = async (offset: number, limit: number) => {
        //本次查询的防乱序序号
        const queryId = ++currentQueryId
        //每次调用此方法都会清空上次的缓冲区
        if(cacheTimer !== null) clearTimeout(cacheTimer)
        //记录下最后一次查询的理论参数
        lastDataUpdateParams = { offset, limit }

        //首先判断请求的数据是否已完全加载
        if(endpoint.proxy.isRangeLoaded(offset, limit) === LoadedStatus.LOADED) {
            //如果数据已完全加载，则直接更新到data
            const result = await endpoint.proxy.queryRange(offset, limit)
            if(queryId >= currentQueryId) {
                const metrics = { total: endpoint.proxy.count()!, offset, limit: result.length }
                data.value = { result, metrics }
            }
        }else{
            //如果未完全加载，那么将本次请求放到缓冲区，并重置倒计时
            const currentCache = {queryId, offset, limit}
            cacheTimer = setTimeout(async () => {
                if(queryId < currentQueryId) return
                const result = await endpoint.proxy.queryRange(currentCache.offset, currentCache.limit)
                if(queryId >= currentQueryId) {
                    const metrics = { total: endpoint.proxy.count()!, offset: currentCache.offset, limit: result.length }
                    data.value = { result, metrics }
                }
                cacheTimer = null
            }, endpoint.proxy.count() === null ? 0 : queryDelay)
        }
    }

    const reset = () => {
        data.value = {
            metrics: {total: undefined, offset: 0, limit: 0},
            result: []
        }
        lastDataUpdateParams = null
    }

    const proxy = useProxy(endpoint.proxy, data)

    //在引用的query endpoint实例更换时，触发一次数据重刷
    //此处调用dataUpdate而不是reset来重刷，是因为希望保持上层应用不会完全刷新列表滚动位置(scrollView插件根据total的重置来判断列表重置)
    watch(endpoint.instance, () => {
        if(lastDataUpdateParams) {
            //需要记录上次请求的数据范围，并用在此处重刷数据
            //因为如果沿用实际metrics的值的话，数据总量有可能增加，那么limit的值可能会比需要的值更小，因此需要记忆理论值
            dataUpdate(lastDataUpdateParams.offset, lastDataUpdateParams.limit).finally()
        }
    })

    //在endpoint的内容变更，且变更对象在影响范围内时，对数据进行更新
    useListeningEvent(endpoint.modifiedEvent, e => {
        //modified事件的更新按照当前实际的metrics就可以。因为数据总量只会增加不会减少，不会造成什么bug
        if(e.type === "modify") {
            if(e.index >= data.value.metrics.offset && e.index < data.value.metrics.offset + data.value.metrics.limit) {
                dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
            }
        }else{ //delete
            if(e.index < data.value.metrics.offset + data.value.metrics.limit) {
                dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
            }
        }
    })

    return {data, dataUpdate, reset, proxy}
}

function useProxy<T>(instance: QueryEndpointInstance<T>, data: Ref<PaginationData<T>>): QueryEndpointInstance<T> {
    return {
        ...instance,
        syncOperations: {
            ...instance.syncOperations,
            find(condition, priorityRange) {
                const range: [number, number] | number | undefined
                    = priorityRange !== undefined ? priorityRange
                    : data.value.metrics.total !== undefined ? [data.value.metrics.offset, data.value.metrics.offset + data.value.metrics.limit]
                    : undefined
                return instance.syncOperations.find(condition, range)
            }
        }
    }
}
