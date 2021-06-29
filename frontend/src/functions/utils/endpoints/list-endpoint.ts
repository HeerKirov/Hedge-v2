import { ref, Ref } from "vue"
import { arrays } from "@/utils/collections"

/* 此处提供了VCA形态的缓存型数据分页查询端点。
 * 它将数据分段缓存以减少查询压力，并将并发查询统一处理。
 * TODO 重构：按更加利于复用的层级进行拆分：基于单个查询条件的类封装；基于查询条件的响应对象；基于虚拟查询的响应对象。
 */

interface ListEndpointOptions<T> {
    /**
     * 根据offset和limit取数据。结果可异步返回。此函数应该直接对接查询API。
     */
    request(offset: number, limit: number): Promise<{ok: true, total: number, result: T[]} | {ok: false, message: string}>
    handleError?(title: string, errorMessage: string | undefined): void
    /**
     * 数据段大小。段指在内部实现中将数据平均切割后的一份，用于优化数据整体查询。
     */
    segmentSize?: number
    /**
     * 查询延时。在提交真实查询后，延时多久以执行查询。用于节流，优化查询频次。延时对初次查询无效。
     */
    queryDelay?: number
}

export interface ListEndpointResult<T> {
    /**
     * 响应式返回的数据结果。
     */
    data: Ref<ListEndpointData<T>>
    /**
     * 提出数据更新。
     */
    dataUpdate(offset: number, limit: number): void
    /**
     * 刷新。这会清空缓存和结果，迫使下层重新提出数据更新。
     */
    refresh(): void
    /**
     * 对数据进行即时更改而无需刷新列表的操作。它不是用来真实修改列表的，只是用来在最小操作代价下保证数据同步。
     */
    operations: {
        /**
         * 根据表达式条件查找指定的项。它只会在已经加载的项中查找，且优先在data的数据范围附近查找。
         * @return 返回项的index，也就是offset。没有查找到指定项就会返回undefined。
         */
        find(condition: (data: T) => boolean): number | undefined
        /**
         * 查找指定位置处的项。如果项不存在，或者未加载，则返回undefined。
         */
        retrieve(index: number): T | undefined
        /**
         * 替换数据列表中指定位置处的项。
         * @return 是否成功替换
         */
        modify(index: number, newData: T): boolean
        /**
         * 从数据列表中删除指定位置处的项。后面的项会前移一位。
         * 后一个段not loaded的段，会被重新标记为not loaded，使其重新加载数据。
         * @return 是否成功删除
         */
        remove(index: number): boolean
    }
}

export interface ListEndpointData<T> {
    metrics: {
        total: number | undefined,
        offset: number,
        limit: number
    }
    result: T[]
}

export function useListEndpoint<T>({ request, handleError, segmentSize, queryDelay }: ListEndpointOptions<T>): ListEndpointResult<T> {
    const size = segmentSize ?? 100
    const queryQueue = useQueryQueue(request, handleError, queryDelay ?? 250)
    const segments = useSegments(size, queryQueue)

    let nextQueryId = 1
    let completedQueryId = 0

    const data: Ref<ListEndpointData<T>> = ref({
        metrics: {total: undefined, offset: 0, limit: 0},
        result: []
    })

    const dataUpdate = async (offset: number, limit: number) => {
        const queryId = nextQueryId++
        const ok = await segments.query(queryId, offset, limit)
        if(ok && queryId > completedQueryId) {
            //ok表示数据可用
            const result: T[] = queryQueue.data.buffer.slice(offset, offset + limit)
            data.value = {
                metrics: {total: queryQueue.data.total ?? undefined, offset, limit: result.length},
                result
            }
            //每次都更新completed query id，保证乱序结果会被丢弃
            completedQueryId = queryId
        }
    }

    const refresh = () => {
        queryQueue.clear()
        segments.clear()
        data.value = {metrics: {total: undefined, offset: 0, limit: 0}, result: []}
    }

    const operations: ListEndpointResult<T>["operations"] = {
        find(condition): number | undefined {
            if(queryQueue.data.total == null) {
                return undefined
            }
            //segment总分片数
            const segmentCount = Math.ceil(queryQueue.data.total / size)
            const segmentList = segments.currentSegments()

            function findInSegment(segmentIndex: number): number | undefined {
                if(segmentList[segmentIndex]?.status === SegmentStatus.LOADED) {
                    const begin = segmentIndex * size, end = Math.min((segmentIndex + 1) * size, queryQueue.data.total!)
                    for(let i = begin; i < end; ++i) {
                        const data = queryQueue.data.buffer[i]
                        if(data != undefined && condition(data)) {
                            return i
                        }
                    }
                }
                return undefined
            }

            //根据当前的数据显示范围计算搜索起始的段位置
            const lowerBound = Math.floor(data.value.metrics.offset / size), upperBound = Math.ceil((data.value.metrics.offset + data.value.metrics.limit) / size)
            //首先在这些段中搜索
            for(let i = lowerBound; i < upperBound; ++i) {
                const result = findInSegment(i)
                if(result != undefined) {
                    return result
                }
            }
            //没有结果后，从lower和upper向两侧迭代
            for(let lower = lowerBound - 1, upper = upperBound; lower >= 0 || upper < segmentCount;) {
                if(lower >= 0) {
                    const result = findInSegment(lower)
                    if(result != undefined) {
                        return result
                    }
                    lower -= 1
                }
                if(upper < segmentCount) {
                    const result = findInSegment(upper)
                    if(result != undefined) {
                        return result
                    }
                    upper += 1
                }
            }
            return undefined
        },
        retrieve(index: number): T | undefined {
            if(index >= 0 && queryQueue.data.total != null && index < queryQueue.data.total) {
                return queryQueue.data.buffer[index]
            }
            return undefined
        },
        modify(index, newData): boolean {
            if(index >= 0 && queryQueue.data.total != null && index < queryQueue.data.total) {
                const segment = Math.floor(index / size)
                if(segments.currentSegments()[segment]?.status === SegmentStatus.LOADED) {
                    queryQueue.data.buffer[index] = newData
                    if(data.value.metrics.offset <= index && index < data.value.metrics.offset + data.value.metrics.limit) {
                        dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
                    }
                    return true
                }
            }
            return false
        },
        remove(index): boolean {
            if(queryQueue.data.total != null && index >= 0 && index < queryQueue.data.total) {
                //移除数据项
                queryQueue.data.buffer.splice(index, 1)
                //发生更改的数据项的段位置和总段数
                const segmentIndex = Math.floor(index / size), segmentCount = Math.ceil(queryQueue.data.total / size)
                const segmentList = segments.currentSegments()
                for(let i = segmentIndex; i < segmentCount; ++i) {
                    const segment = segmentList[i]
                    if(segment != undefined && segmentList[i + 1]?.status !== SegmentStatus.LOADED) {
                        //某个段的后一个段not loaded时，这个段需要被标记为not loaded
                        segment.status = SegmentStatus.NOT_LOADED
                        segment.callbacks.splice(0, segment.callbacks.length)
                    }
                }
                queryQueue.data.total -= 1

                if(index >= data.value.metrics.offset) {
                    dataUpdate(data.value.metrics.offset, data.value.metrics.limit).finally()
                }
                return true
            }
            return false
        }
    }

    return {data, dataUpdate, refresh, operations}
}

function useSegments(segmentSize: number, queryQueue: ReturnType<typeof useQueryQueue>) {
    let segments: Segment[] = []

    const query = (queryId: number, offset: number, limit: number): Promise<boolean> => {
        //计算出正确的范围，避免超出总量，导致出现不应该出现的segment
        const beginItem = offset < 0 ? 0 : queryQueue.data.total != null && offset > queryQueue.data.total ? queryQueue.data.total : offset
        const endItem = offset + limit < 0 ? 0 : queryQueue.data.total != null && offset + limit > queryQueue.data.total ? queryQueue.data.total : offset + limit
        //计算segment的范围
        const begin = Math.floor(beginItem / segmentSize), end = Math.ceil(endItem / segmentSize)

        let leaveSegment = end - begin
        let isResolved = false

        return new Promise<boolean>(resolve => {
            const segmentCallback = (ok: boolean) => {
                if(!isResolved) {
                    if(ok) {
                        //如果回调是true，表示当前的segment已经准备完成，使leave数量减1
                        leaveSegment -= 1
                        if(leaveSegment <= 0) {
                            //数量减少到0表示所有segment都已经准备完成，可以完成总回调
                            isResolved = true
                            resolve(true)
                        }
                    }else{
                        //如果回调是false，表示因为error或cancel，此次查询应当被取消，那么直接返回，不再等待所有回调完成
                        isResolved = true
                        resolve(false)
                    }
                }
            }

            //处于not loaded状态，需要发起一次请求的段
            const requiredSegments: Segment[] = []

            for(let i = begin; i < end; ++i) {
                let segment = segments[i]
                if(!segment || segment.status === SegmentStatus.NOT_LOADED) {
                    //对于not loaded的segment，将其放入请求队列，并注册回调
                    if(!segment) segments[i] = segment = createSegment(i)
                    segment.callbacks = [segmentCallback]
                    requiredSegments.push(segment)
                }else if(segment.status === SegmentStatus.LOADING) {
                    //对于loading的segment，注册回调
                    segment.callbacks.push(segmentCallback)
                }else{
                    //对于loaded的段，直接调用回调结果
                    leaveSegment -= 1
                }
            }

            if(leaveSegment <= 0) {
                //如果发现剩余的segment已经为0，则直接回调
                isResolved = true
                resolve(true)
            }else{
                //将需要请求的segment按照连续性分割成数个分片
                const splits = arrays.split(requiredSegments, (a, b) => b.index - a.index > 1)
                for (const split of splits) {
                    //计算出每个分片的数据范围
                    const offset = split[0].index * segmentSize, limit = (split[split.length - 1].index + 1) * segmentSize - offset
                    //发起查询请求
                    queryQueue.query(queryId, offset, limit, queryCallback(queryId, createSegmentSnapshot(split)))
                }
            }
        })
    }

    const queryCallback = (queryId: number, snapshot: SegmentSnapshot) => (status: QueryCallback) => {
        //请求的回调
        if(status === QueryCallback.QUERYING) {
            //状态变更为querying，相关的segment状态都设定为loading
            snapshot.setStatus(SegmentStatus.LOADING)
        }else if(status === QueryCallback.OK) {
            //状态变更为ok，相关的segment状态都设定为loaded，向snapshot回调true
            snapshot.setStatus(SegmentStatus.LOADED)
            snapshot.callback(true)
        }else if(status === QueryCallback.ERROR) {
            //出现error状态，向snapshot回调false，并重置segment回not loaded
            snapshot.setStatus(SegmentStatus.NOT_LOADED)
            snapshot.callback(false)
        }else{
            //canceled，向snapshot回调false，不变更segment
            snapshot.callback(false)
        }
    }

    const clear = () => {
        for (let segment of segments) {
            for (const callback of segment.callbacks) {
                callback(false)
            }
            segment.callbacks = []
        }
        segments = []
    }

    const currentSegments = () => segments

    function createSegment(index: number) {
        return {
            index,
            status: SegmentStatus.NOT_LOADED,
            callbacks: []
        }
    }

    function createSegmentSnapshot(segments: Segment[]): SegmentSnapshot {
        const callbacks = segments.map(segment => segment.callbacks)
        return {
            setStatus(status: SegmentStatus) {
                for (const segment of segments) {
                    segment.status = status
                }
            },
            callback(ok: boolean) {
                for (const callback of callbacks) {
                    for (const one of callback) {
                        one(ok)
                    }
                    callback.splice(0, callback.length)
                }
            }
        }
    }

    return {query, clear, currentSegments}
}

function useQueryQueue<T>(request: ListEndpointOptions<T>["request"], errorHandler: ListEndpointOptions<T>["handleError"], queryDelay: number) {
    const data = <{buffer: T[], total: number | null}>{
        buffer: [],
        total: null
    }

    let current: QueryInfoGroup | null = null

    const query = (queryId: number, offset: number, limit: number, callback: (status: QueryCallback) => void) => {
        if(current?.queryId === queryId) {
            //两次查询拥有相同的queryId时，它们将会并发执行，而不是重置计时器
            current.queue.push([offset, limit, callback])
        }else{
            //两次查询拥有不同的queryId时，将会丢弃上次的查询
            if(current != null) {
                clearTimeout(current.timer)
                for (const [, , callback] of current.queue) {
                    callback(QueryCallback.CANCELED)
                }
            }
            //构造新的数据组
            const group = current = {
                queryId,
                queue: [[offset, limit, callback]],
                timer: 0
            }
            //total为null可以判定为初次查询，此时没有延时，立即加载数据
            group.timer = setTimeout(execute(group), data.total != null ? queryDelay : 0)
        }
    }

    const clear = () => {
        data.buffer = []
        data.total = null
    }

    const execute = (group: QueryInfoGroup) => async () => {
        current = null
        for (const [, , callback] of group.queue) {
            callback(QueryCallback.QUERYING)
        }
        for await (const [offset, limit, callback] of group.queue) {
            const res = await request(offset, limit)
            if(res.ok) {
                data.total = res.total
                for(let i = 0; i < res.result.length; ++i) {
                    data.buffer[offset + i] = res.result[i]
                }
                callback(QueryCallback.OK)
            }else{
                errorHandler?.("Error Occurred", res.message)
                callback(QueryCallback.ERROR)
            }
        }
    }

    return {data, query, clear}
}

enum SegmentStatus {
    NOT_LOADED,
    LOADING,
    LOADED
}

enum QueryCallback {
    CANCELED,
    QUERYING,
    OK,
    ERROR
}

interface Segment {
    index: number
    status: SegmentStatus
    callbacks: ((ok: boolean) => void)[]
}

interface SegmentSnapshot {
    setStatus(status: SegmentStatus)
    callback(ok: boolean)
}

interface QueryInfoGroup {
    queryId: number
    queue: [number, number, (status: QueryCallback) => void][]
    timer: number
}
