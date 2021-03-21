import { ref, Ref } from "vue"

/* 此处提供了VCA形态的虚拟列表 - REST API的中间衔接器。
 * 它负责处理从虚拟列表发出的更新事件和查询回显，并处理中间缓存和事件节流。
 */

export interface VirtualEndpointFunction<T> {
    (offset: number, limit: number): Promise<{total: number, result: T[]}>
}

interface VirtualEndpointResult<T> {
    data: Ref<VirtualEndpointData<T>>
    dataUpdate(offset: number, limit: number): void
    refresh(): void
}

interface VirtualEndpointData<T> {
    metrics: {
        total: number | undefined,
        offset: number,
        limit: number
    }
    result: T[]
}

export function useVirtualEndpoint<T>(requestFunction: VirtualEndpointFunction<T>): VirtualEndpointResult<T> {
    /* TODO 缓存机制
     *      目标是在一次参数不变的查询中，将已经查询过的项目缓存到一个数组里。
     *      dataUpdate触发时，查询缓存是否可用。
     *      由于每次查询的范围和缓存范围很可能不完全命中，需要一个判断缓存命中的方案，和一个判断需要查询的实际范围的方案。
     * TODO 事件节流
     *      如果刷新事件来得过于频繁，可能会高频查询，带来服务压力
     *      在dataUpdate的触发事件中，如果晚触发的result已经刷入data，那么早触发但返回更晚的result应当被放弃。
     */
    let buffer: T[] = []

    const data: Ref<VirtualEndpointData<T>> = ref({
        metrics: {total: undefined, offset: 0, limit: 0},
        result: []
    })
    const dataUpdate = async (offset: number, limit: number) => {
        const res = await requestFunction(offset, limit)
    }
    const refresh = () => {
        buffer = []
        //TODO 清空缓存
        data.value = { metrics: {total: undefined, offset: 0, limit: 0}, result: [] }
    }

    return {data, dataUpdate, refresh}
}