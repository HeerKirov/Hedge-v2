import { Ref, shallowRef, watch } from "vue"
import { QueryEndpointResult } from "./query-endpoint"
import { LoadedStatus } from "./instance"
import { useListeningEvent } from "@/functions/utils/emitter";

export interface PaginationOptions {
    /**
     * 执行查询的延时。请求未加载的新数据会延迟一定时间，确保没有新的请求冲刷时才会确认执行。
     * 没有任何数据时，初次请求不会延时。
     */
    queryDelay?: number
}

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
    let cacheTimer: number | null = null

    const dataUpdate = async (offset: number, limit: number) => {
        //本次查询的防乱序序号
        const queryId = ++currentQueryId
        //每次调用此方法都会清空上次的缓冲区
        if(cacheTimer !== null) clearTimeout(cacheTimer)

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
    }

    //在引用的query endpoint实例更换时，触发一次数据重刷
    watch(endpoint.instance, reset)

    //在endpoint的内容变更，且变更对象在影响范围内时，对数据进行更新
    useListeningEvent(endpoint.modifiedEvent, e => {
        if(e.type === "modify") {
            if(e.index >= data.value.metrics.offset && e.index < data.value.metrics.offset + data.value.metrics.limit) {
                dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
            }
        }else{
            if(e.index < data.value.metrics.offset + data.value.metrics.limit) {
                dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
            }
        }
    })

    return {data, dataUpdate, reset}
}
