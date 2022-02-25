import { ref, Ref } from "vue"
import { Response } from "@/functions/adapter-http"
import { ListResult } from "@/functions/adapter-http/impl/generic"
import { BasicException } from "@/functions/adapter-http/exception"

/* 此处提供了VCA形态的连续型数据查询端点。
 * 它提供了一个连续查询模型，供使用者在一次查询中不断加载新的内容，并在查询参数变化时重置查询。
 */

interface ContinuousEndpointOptions<T, E extends BasicException> {
    /**
     * 根据offset和limit取数据。结果可异步返回。此函数应该直接对接查询API。
     */
    request(offset: number, limit: number): Promise<Response<ListResult<T>, E>>
    /**
     * 捕获请求过程中抛出的错误。
     */
    handleError?(title: string, errorMessage: string | undefined): void
    /**
     * 初次加载的数量。
     */
    initSize: number
    /**
     * 后续加载的数量。
     */
    continueSize?: number
}

export interface ContinuousEndpointResult<T> {
    /**
     * 是否正在加载中。
     */
    loading: Ref<boolean>
    /**
     * 响应式返回的数据结果。
     */
    data: Ref<ContinuousEndpointData<T>>
    /**
     * 刷新。这会重置数据。
     */
    refresh(): void
    /**
     * 继续。这会继续加载后续的数据。
     */
    next(): void
    /**
     * 清空。只是清空，而不加载数据。
     */
    clear(): void
}

export interface ContinuousEndpointData<T> {
    total: number
    result: T[]
}

export function useContinuousEndpoint<T, E extends BasicException>(options: ContinuousEndpointOptions<T, E>): ContinuousEndpointResult<T> {
    let version = 0

    const data: Ref<ContinuousEndpointData<T>> = ref({total: 0, result: []})

    const loading = ref(true)

    const refresh = async () => {
        //记录本次查询的版本号，同时因为刷新，使版本号+1
        const currentVersion = ++version

        loading.value = true

        const res = await options.request(0, options.initSize)
        if(currentVersion !== version) {
            //版本号已经后推，或本次查询的上限范围已经被写过的情况下，丢弃本次查询结果
            loading.value = false
            return
        }
        if(res.ok) {
            data.value = {total: res.data.total, result: res.data.result}
        }else{
            options.handleError?.(`Error occurred: ${res.exception.code}`, res.exception.message)
        }
        loading.value = false
    }

    const next = async () => {
        if(loading.value) {
           return
        }
        const currentVersion = version
        const range = (options.continueSize ?? options.initSize) + data.value.result.length

        loading.value = true

        const res = await options.request(data.value.result.length, options.continueSize ?? options.initSize)
        if(currentVersion !== version || data.value.result.length > range) {
            loading.value = false
            return
        }
        if(res.ok) {
            data.value.total = res.data.total
            data.value.result.push(...res.data.result)
        }else{
            options.handleError?.(`Error occurred: ${res.exception.code}`, res.exception.message)
        }
        loading.value = false
    }

    const clear = () => {
        version += 1
        data.value = {total: 0, result: []}
        loading.value = false
    }

    return {loading, data, refresh, next, clear}
}
